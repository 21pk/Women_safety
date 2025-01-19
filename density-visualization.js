// Vehicle Density Visualization
class DensityVisualization {
    constructor(containerId, duration = 10) {
        this.container = document.getElementById(containerId);
        this.duration = Math.min(Math.max(duration, 10), 60); // Between 10 and 60 seconds
        this.vehicles = [];
        this.density = 0;
        this.isActive = false;
        this.initialize();
    }

    initialize() {
        // Create vehicle container
        this.vehicleContainer = document.createElement('div');
        this.vehicleContainer.className = 'vehicle-container';
        
        // Create density indicator
        this.densityIndicator = document.createElement('div');
        this.densityIndicator.className = 'density-indicator';
        
        // Create timer
        this.timer = document.createElement('div');
        this.timer.className = 'timer';
        
        // Append elements
        this.container.appendChild(this.vehicleContainer);
        this.container.appendChild(this.densityIndicator);
        this.container.appendChild(this.timer);
    }

    start() {
        this.isActive = true;
        this.startTime = Date.now();
        this.animate();
        this.generateVehicles();
    }

    stop() {
        this.isActive = false;
        this.vehicles = [];
        this.vehicleContainer.innerHTML = '';
        this.updateTimer(0);
    }

    generateVehicles() {
        if (!this.isActive) return;

        // Create a new vehicle
        const vehicle = document.createElement('div');
        vehicle.className = 'vehicle';
        vehicle.style.left = '0%';
        vehicle.style.top = Math.random() * 80 + '%';
        
        // Randomly choose vehicle type
        const vehicleType = Math.random() < 0.5 ? 'car' : 'bike';
        vehicle.classList.add(vehicleType);

        this.vehicleContainer.appendChild(vehicle);
        this.vehicles.push(vehicle);

        // Animate vehicle
        setTimeout(() => {
            vehicle.style.left = '100%';
            setTimeout(() => {
                if (this.vehicleContainer.contains(vehicle)) {
                    this.vehicleContainer.removeChild(vehicle);
                    this.vehicles = this.vehicles.filter(v => v !== vehicle);
                }
            }, 3000);
        }, 100);

        // Generate next vehicle after random interval
        const nextInterval = Math.random() * 2000 + 1000;
        if (this.isActive) {
            setTimeout(() => this.generateVehicles(), nextInterval);
        }
    }

    animate() {
        if (!this.isActive) return;

        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = this.duration - elapsed;

        if (remaining <= 0) {
            this.stop();
            return;
        }

        // Update density based on number of vehicles
        this.density = Math.min(this.vehicles.length / 10, 1);
        this.updateDensityIndicator();
        this.updateTimer(remaining);

        requestAnimationFrame(() => this.animate());
    }

    updateDensityIndicator() {
        const percentage = Math.round(this.density * 100);
        this.densityIndicator.style.width = percentage + '%';
        this.densityIndicator.style.backgroundColor = this.getDensityColor(this.density);
    }

    updateTimer(seconds) {
        this.timer.textContent = Math.ceil(seconds) + 's';
    }

    getDensityColor(density) {
        // Color gradient from green (low density) to red (high density)
        const red = Math.round(255 * density);
        const green = Math.round(255 * (1 - density));
        return `rgb(${red}, ${green}, 0)`;
    }
}

// Initialize visualizations when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    const boxes = ['box1', 'box2', 'box3', 'box4'].map(id => {
        return new DensityVisualization(id, Math.random() * 50 + 10); // Random duration between 10-60s
    });

    // Start all visualizations
    boxes.forEach(box => box.start());

    // Add restart button functionality
    document.getElementById('restartBtn')?.addEventListener('click', () => {
        boxes.forEach(box => {
            box.stop();
            setTimeout(() => box.start(), 100);
        });
    });
});
