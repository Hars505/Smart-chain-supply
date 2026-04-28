# ml/route_optimizer.py
"""
OR-Tools based route optimizer.
Triggered when risk_score > 70.
Returns top 3 alternate routes ranked by composite score (cost + time + risk).
"""

from __future__ import annotations
import math
from dataclasses import dataclass, field
from typing import Optional
import numpy as np


# ─── Hub network (lat/lng + port congestion) ────────────────────────────────
HUBS: dict[str, dict] = {
    "Mumbai":        {"lat": 19.08, "lng": 72.88, "congestion": 5.5, "type": "port"},
    "Colombo":       {"lat": 6.93,  "lng": 79.84, "congestion": 3.2, "type": "port"},
    "Singapore":     {"lat": 1.29,  "lng": 103.85,"congestion": 4.1, "type": "port"},
    "Port Klang":    {"lat": 3.00,  "lng": 101.39,"congestion": 3.8, "type": "port"},
    "Jeddah":        {"lat": 21.48, "lng": 39.17, "congestion": 6.1, "type": "port"},
    "Suez":          {"lat": 30.0,  "lng": 32.57, "congestion": 7.5, "type": "canal"},
    "Port Said":     {"lat": 31.26, "lng": 32.30, "congestion": 6.0, "type": "port"},
    "Rotterdam":     {"lat": 51.92, "lng": 4.48,  "congestion": 3.0, "type": "port"},
    "Hamburg":       {"lat": 53.55, "lng": 9.99,  "congestion": 3.5, "type": "port"},
    "Antwerp":       {"lat": 51.22, "lng": 4.40,  "congestion": 4.2, "type": "port"},
    "Cape Town":     {"lat": -33.9, "lng": 18.42, "congestion": 2.5, "type": "port"},
    "Durban":        {"lat": -29.9, "lng": 31.00, "congestion": 4.8, "type": "port"},
    "Shanghai":      {"lat": 31.23, "lng": 121.47,"congestion": 7.2, "type": "port"},
    "Los Angeles":   {"lat": 33.72, "lng": -118.27,"congestion":6.8, "type": "port"},
    "Dubai":         {"lat": 25.20, "lng": 55.27, "congestion": 4.8, "type": "port"},
}

# ─── Edges: (origin, dest, base_cost_usd_per_teu, base_days, risk_multiplier) ─
EDGES: list[tuple] = [
    ("Mumbai",     "Colombo",    800,   2.0,  1.0),
    ("Mumbai",     "Jeddah",     1200,  5.0,  1.3),
    ("Mumbai",     "Singapore",  1500,  10.0, 1.0),
    ("Colombo",    "Singapore",  900,   4.0,  1.0),
    ("Colombo",    "Jeddah",     1100,  6.0,  1.2),
    ("Singapore",  "Port Klang", 250,   0.5,  1.0),
    ("Singapore",  "Shanghai",   1800,  4.0,  1.1),
    ("Jeddah",     "Suez",       700,   1.5,  1.8),   # high risk via Red Sea
    ("Jeddah",     "Dubai",      400,   1.0,  1.0),
    ("Dubai",      "Suez",       900,   2.0,  1.8),
    ("Dubai",      "Cape Town",  2200,  9.0,  1.1),   # Cape of Good Hope route
    ("Suez",       "Port Said",  200,   0.3,  1.2),
    ("Port Said",  "Rotterdam",  1800,  5.0,  1.0),
    ("Port Said",  "Hamburg",    1900,  5.5,  1.0),
    ("Port Said",  "Antwerp",    1850,  5.2,  1.0),
    ("Cape Town",  "Durban",     500,   1.5,  1.0),
    ("Cape Town",  "Rotterdam",  2800,  12.0, 1.0),
    ("Cape Town",  "Hamburg",    2900,  12.5, 1.0),
    ("Durban",     "Rotterdam",  2700,  11.0, 1.0),
    ("Rotterdam",  "Hamburg",    400,   1.0,  1.0),
    ("Hamburg",    "Antwerp",    350,   0.8,  1.0),
]


@dataclass
class RouteOption:
    path: list[str]
    total_cost_usd: float
    transit_days: float
    composite_risk: float
    carriers: list[str]
    summary: str
    savings_vs_original: dict = field(default_factory=dict)


class RouteOptimizer:
    """
    Dijkstra on a weighted graph where edge weights blend cost, time, and risk.
    When risk > 70, returns top 3 alternate routes with tradeoff analysis.
    """

    def __init__(self, current_risk_scores: Optional[dict] = None) -> None:
        # current_risk_scores: {hub_name: risk_0_10} for dynamic re-weighting
        self.current_risk_scores = current_risk_scores or {}
        self.graph = self._build_graph()

    def _build_graph(self) -> dict[str, list[dict]]:
        graph: dict[str, list[dict]] = {h: [] for h in HUBS}
        for origin, dest, cost, days, risk_mult in EDGES:
            # Apply dynamic risk overlay if available
            dynamic_mult = 1.0
            if origin in self.current_risk_scores:
                dynamic_mult = 1.0 + (self.current_risk_scores[origin] / 10.0) * 0.5

            graph[origin].append({
                "dest": dest,
                "cost": cost,
                "days": days,
                "risk_mult": risk_mult * dynamic_mult,
            })
            # Bidirectional (with slight return penalty for backtracking)
            graph[dest].append({
                "dest": origin,
                "cost": cost * 1.05,
                "days": days * 1.05,
                "risk_mult": risk_mult * dynamic_mult,
            })
        return graph

    def _haversine(self, h1: str, h2: str) -> float:
        """Great-circle distance heuristic for A* (not used here but kept for future upgrade)."""
        a, b = HUBS[h1], HUBS[h2]
        R = 6371
        dlat = math.radians(b["lat"] - a["lat"])
        dlng = math.radians(b["lng"] - a["lng"])
        c = 2 * math.asin(math.sqrt(
            math.sin(dlat/2)**2 + math.cos(math.radians(a["lat"]))
            * math.cos(math.radians(b["lat"])) * math.sin(dlng/2)**2
        ))
        return R * c

    def _dijkstra_k_paths(
        self,
        source: str,
        target: str,
        k: int = 3,
        weight: str = "composite",
    ) -> list[list[dict]]:
        """Yen's K-Shortest Paths algorithm."""
        import heapq

        def edge_weight(edge: dict) -> float:
            cost_norm = edge["cost"] / 3000.0
            days_norm = edge["days"] / 20.0
            risk_norm = (edge["risk_mult"] - 1.0) / 1.0
            return cost_norm * 0.40 + days_norm * 0.35 + risk_norm * 0.25

        def dijkstra(blocked_nodes: set, blocked_edges: set):
            dist = {n: float("inf") for n in self.graph}
            prev = {n: None for n in self.graph}
            edge_prev = {n: None for n in self.graph}
            dist[source] = 0
            heap = [(0, source)]
            while heap:
                d, u = heapq.heappop(heap)
                if d > dist[u]:
                    continue
                for edge in self.graph.get(u, []):
                    v = edge["dest"]
                    if v in blocked_nodes:
                        continue
                    if (u, v) in blocked_edges:
                        continue
                    w = edge_weight(edge)
                    if dist[u] + w < dist[v]:
                        dist[v] = dist[u] + w
                        prev[v] = u
                        edge_prev[v] = edge
                        heapq.heappush(heap, (dist[v], v))
            if dist[target] == float("inf"):
                return None, None, None
            path, edges_used = [], []
            node = target
            while node:
                path.append(node)
                if edge_prev[node]:
                    edges_used.append(edge_prev[node])
                node = prev[node]
            path.reverse()
            edges_used.reverse()
            return path, edges_used, dist[target]

        # Find first shortest path
        A = []  # k shortest paths
        path, edges, cost = dijkstra(set(), set())
        if path is None:
            return []
        A.append({"path": path, "edges": edges, "cost": cost})

        B = []  # candidate paths

        for i in range(1, k):
            if not A:
                break
            prev_path = A[-1]["path"]
            prev_edges = A[-1]["edges"]

            for j in range(len(prev_path) - 1):
                spur_node = prev_path[j]
                root_path = prev_path[:j+1]

                blocked_edges = set()
                blocked_nodes = set(root_path[:-1])

                for p in A:
                    if len(p["path"]) > j and p["path"][:j+1] == root_path:
                        e = p["edges"][j] if j < len(p["edges"]) else None
                        if e:
                            blocked_edges.add((spur_node, e["dest"]))

                spur_path, spur_edges, spur_cost = dijkstra(blocked_nodes, blocked_edges)
                if spur_path is None or spur_path[0] != spur_node:
                    continue

                total_path = root_path[:-1] + spur_path
                total_edges = prev_edges[:j] + spur_edges
                if total_path not in [c["path"] for c in B + A]:
                    B.append({"path": total_path, "edges": total_edges, "cost": spur_cost})

            if not B:
                break
            B.sort(key=lambda x: x["cost"])
            A.append(B.pop(0))

        return A[:k]

    def get_alternate_routes(
        self,
        origin: str,
        destination: str,
        original_cost: float = 3000.0,
        original_days: float = 25.0,
    ) -> list[RouteOption]:
        """
        Returns top 3 RouteOption objects ranked by composite score.
        """
        if origin not in HUBS:
            origin = self._fuzzy_match(origin)
        if destination not in HUBS:
            destination = self._fuzzy_match(destination)

        paths = self._dijkstra_k_paths(origin, destination, k=3)

        carriers_pool = ["Maersk", "MSC", "CMA-CGM", "COSCO", "Evergreen"]
        results = []

        for idx, p in enumerate(paths):
            if not p["path"]:
                continue
            total_cost = sum(e["cost"] for e in p["edges"])
            total_days = sum(e["days"] for e in p["edges"])
            avg_risk_mult = float(np.mean([e["risk_mult"] for e in p["edges"]])) if p["edges"] else 1.0
            composite_risk = min((avg_risk_mult - 1.0) * 50 + 20, 95)

            chosen_carriers = [carriers_pool[i % len(carriers_pool)]
                               for i in range(len(p["path"]) - 1)]

            savings = {
                "cost_delta_usd": round(total_cost - original_cost, 0),
                "time_delta_days": round(total_days - original_days, 1),
                "risk_delta": round(composite_risk - 65, 1),  # vs assumed current risk
            }

            summary = (
                f"Via {' -> '.join(p['path'][1:-1]) or 'direct'}: "
                f"${total_cost:,.0f} | {total_days:.1f} days | Risk {composite_risk:.0f}/100"
            )

            results.append(RouteOption(
                path=p["path"],
                total_cost_usd=round(total_cost, 2),
                transit_days=round(total_days, 1),
                composite_risk=round(composite_risk, 1),
                carriers=chosen_carriers,
                summary=summary,
                savings_vs_original=savings,
            ))

        results.sort(key=lambda r: r.composite_risk * 0.4 + r.transit_days * 0.35 + r.total_cost_usd / 5000 * 0.25)
        return results[:3]

    @staticmethod
    def _fuzzy_match(name: str) -> str:
        """Simple fuzzy match to nearest hub name."""
        name_l = name.lower()
        for hub in HUBS:
            if hub.lower() in name_l or name_l in hub.lower():
                return hub
        return "Singapore"  # fallback hub
