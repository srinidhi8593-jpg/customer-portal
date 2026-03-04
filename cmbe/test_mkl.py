import torch
import torch.nn as nn
import time

def simulate():
    input_dim, output_dim = 1000, 10
    model = nn.Sequential(
        nn.Linear(input_dim, 2048),
        nn.ReLU(),
        nn.Linear(2048, 2048),
        nn.ReLU(),
        nn.Linear(2048, output_dim)
    )
    X = torch.rand(10000, input_dim)

    # Warmup
    with torch.no_grad():
        out = model(X)

    start = time.time()
    with torch.no_grad():
        for _ in range(50):
            out = model(X)
    end = time.time()
    print(f"Time taken: {end - start:.4f}s")

if __name__ == "__main__":
    simulate()
