import numpy as np
from numpy.linalg import norm


def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    v1, v2 = np.array(v1), np.array(v2)

    if v1.size == 0 or v2.size == 0:
        return 0.0

    return float(np.dot(v1, v2) / (norm(v1) * norm(v2))) * 100