import os
import torch
import time
import sys

def simulate_training_test(n_threads: int):
    print(f"Testing with {n_threads} thread(s)")
    if n_threads is not None and n_threads > 0:
        os.environ['OMP_NUM_THREADS']=str(n_threads) 
        os.environ['OPENBLAS_NUM_THREADS'] = str(n_threads)
        os.environ['MKL_NUM_THREADS'] = str(n_threads)
        torch.set_num_threads(n_threads) 

    input_dim, output_dim = 1500, 10
    
    # Larger layers to simulate load on BLAS
    model = torch.nn.Sequential(
        torch.nn.Linear(input_dim, 2048),
        torch.nn.ReLU(),
        torch.nn.Linear(2048, 2048),
        torch.nn.ReLU(),
         torch.nn.Linear(2048, output_dim)
    )
    
    # Large simulated batch
    X = torch.rand(10000, input_dim)
    
    # Warm up pass
    with torch.no_grad():
        out = model(X)
        
    start_time = time.time()
    num_iters = 50
    with torch.no_grad():
        for _ in range(num_iters):
             out = model(X)
    end_time = time.time()
        
    print(f"Execution time for {num_iters} iters : {end_time - start_time:.4f} seconds\n")

if __name__ == "__main__":
    n_threads = None
    if len(sys.argv) > 1:
        n_threads = int(sys.argv[1])
        simulate_training_test(n_threads)
    else:
        for t in [1, 2, 4, 8, 16]:
            simulate_training_test(t)
