# utils/gpu_optimizer.py
import torch
import logging
import os

logger = logging.getLogger(__name__)

def get_gpu_vram():
    """Get available GPU VRAM in GB."""
    if torch.cuda.is_available():
        total_memory = torch.cuda.get_device_properties(0).total_memory
        return total_memory / (1024**3)  # Convert to GB
    return 0

def auto_configure_gpu(config):
    """Automatically adjust configuration based on GPU capabilities."""
    if not torch.cuda.is_available():
        logger.info("CUDA not available, using CPU configuration")
        # CPU configuration
        config['training']['num_workers'] = 0
        config['training']['pin_memory'] = False
        config['training']['mixed_precision'] = False
        config['data']['image_size'] = 168
        config['data']['window_size'] = 2
        config['training']['base_batch_size'] = 1
        return config
    
    # Get GPU VRAM
    vram_gb = get_gpu_vram()
    logger.info(f"Detected GPU with {vram_gb:.1f}GB VRAM")
    
    # Determine profile based on VRAM
    if vram_gb < 7:
        profile = "6"
    elif vram_gb < 10:
        profile = "8"
    elif vram_gb < 15:
        profile = "12"
    else:
        profile = "16"
    
    logger.info(f"Using GPU profile: {profile}GB")
    
    # Apply profile settings
    profiles = config.get('gpu_profiles', {})
    if profile in profiles:
        gpu_config = profiles[profile]
        
        # Adjust data settings
        if 'image_size' in gpu_config:
            config['data']['image_size'] = gpu_config['image_size']
        if 'window_size' in gpu_config:
            config['data']['window_size'] = gpu_config['window_size']
        
        # Adjust training settings
        config['training']['batch_size'] = gpu_config['batch_size']
        config['training']['gradient_accumulation'] = gpu_config.get('gradient_accumulation', 1)
        
        # Mixed precision
        mp_setting = config['training']['mixed_precision']
        if mp_setting == 'auto':
            config['training']['mixed_precision'] = gpu_config['mixed_precision']
        
        # Use gradient checkpointing for low VRAM
        if vram_gb < 8:
            logger.info("Enabling gradient checkpointing for memory efficiency")
            config['model']['use_gradient_checkpointing'] = True
        else:
            config['model']['use_gradient_checkpointing'] = gpu_config.get('use_gradient_checkpointing', False)
    
    # Set system parameters based on OS
    if os.name == 'nt':  # Windows
        logger.warning("Running on Windows - setting num_workers=0")
        config['training']['num_workers'] = 0
        config['training']['pin_memory'] = False
    else:  # Linux/Mac
        # Set num_workers to min(4, half CPU cores)
        cpu_cores = os.cpu_count() or 4
        config['training']['num_workers'] = min(4, cpu_cores // 2)
        config['training']['pin_memory'] = True
    
    return config

def verify_configuration(config):
    """Verify and finalize configuration."""
    # Ensure numeric values
    config['training']['learning_rate'] = float(config['training']['learning_rate'])
    config['training']['weight_decay'] = float(config['training']['weight_decay'])
    
    # Calculate effective batch size
    base_bs = config['training'].get('base_batch_size', config['training']['batch_size'])
    eff_bs = config['training']['batch_size'] * config['training']['gradient_accumulation']
    logger.info(f"Using batch_size={config['training']['batch_size']} "
               f"with gradient_accumulation={config['training']['gradient_accumulation']} "
               f"(effective batch size: {eff_bs})")
    
    return config