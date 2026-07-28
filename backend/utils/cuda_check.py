import torch
import logging

logger = logging.getLogger(__name__)

def check_cuda_setup():
    """Check CUDA setup and verify GPU is properly configured."""
    logger.info("=" * 50)
    logger.info("CUDA SETUP VERIFICATION")
    logger.info("=" * 50)
    
    logger.info(f"Python version: {torch.__version__}")
    logger.info(f"PyTorch version: {torch.__version__}")
    logger.info("")
    
    logger.info(f"CUDA available: {torch.cuda.is_available()}")
    
    if torch.cuda.is_available():
        logger.info(f"Current CUDA device: {torch.cuda.current_device()}")
        logger.info(f"Device name: {torch.cuda.get_device_name()}")
        logger.info(f"CUDA version: {torch.version.cuda}")
        logger.info(f"cuDNN version: {torch.backends.cudnn.version()}")
        
        # Test GPU
        x = torch.tensor([1.0, 2.0, 3.0], device='cuda')
        logger.info("")
        logger.info("Successfully created tensor on GPU: cuda:0")
        logger.info("CUDA is properly configured and ready for use.")
        
        # Memory info
        logger.info("GPU Memory:")
        logger.info(f"Total: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
        logger.info(f"Allocated: {torch.cuda.memory_allocated(0) / 1024**3:.2f} GB")
        logger.info(f"Reserved: {torch.cuda.memory_reserved(0) / 1024**3:.2f} GB")