/**
 * Wheel Module - Handles wheel rendering and spin logic
 * Manages wheel display, animations, and result calculation
 */

const Wheel = {
    // State
    isSpinning: false,
    currentRotation: 0,
    users: [],
    sliceAngle: 0,

    /**
     * Initialize wheel
     */
    init() {
        this.users = Storage.getUsers();
        this.render();
    },

    /**
     * Render the wheel with current users using SVG
     */
    render() {
        const wheelElement = document.getElementById('wheel');
        this.users = Storage.getUsers();

        // Clear existing SVG
        const existingSvg = wheelElement.querySelector('svg');
        if (existingSvg) {
            existingSvg.remove();
        }

        if (this.users.length === 0) return;

        this.sliceAngle = 360 / this.users.length;

        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 200 200');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.zIndex = '5';

        // Draw wheel slices
        this.users.forEach((user, index) => {
            const startAngle = index * this.sliceAngle;
            const endAngle = (index + 1) * this.sliceAngle;
            const midAngle = (startAngle + endAngle) / 2;

            // Create path for pie slice
            const path = this.createPieSlicePath(100, 100, 95, startAngle, endAngle);

            const sliceElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            sliceElement.setAttribute('d', path);
            sliceElement.setAttribute('fill', user.color);
            sliceElement.setAttribute('stroke', 'white');
            sliceElement.setAttribute('stroke-width', '2');
            sliceElement.setAttribute('data-user-id', user.id);
            sliceElement.setAttribute('data-user-name', user.name);
            sliceElement.id = `slice-${user.id}`;

            svg.appendChild(sliceElement);

            // Add text label
            const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            const midRad = (midAngle * Math.PI) / 180;
            const textDistance = 65;
            const textX = 100 + Math.cos(midRad - Math.PI / 2) * textDistance;
            const textY = 100 + Math.sin(midRad - Math.PI / 2) * textDistance;

            let displayName = user.name;
            if (displayName.length > 10) {
                displayName = displayName.substring(0, 8) + '...';
            }

            textElement.setAttribute('x', textX);
            textElement.setAttribute('y', textY);
            textElement.setAttribute('text-anchor', 'middle');
            textElement.setAttribute('dominant-baseline', 'middle');
            textElement.setAttribute('fill', 'white');
            textElement.setAttribute('font-weight', 'bold');
            textElement.setAttribute('font-size', '12');
            textElement.setAttribute('text-shadow', '1px 1px 2px rgba(0, 0, 0, 0.5)');
            textElement.setAttribute('pointer-events', 'none');
            textElement.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.5)';

            // Rotate text to be readable - always keep between -90 and 90 for left-to-right reading
            let rotation = midAngle - 90;

            // Normalize rotation to -180 to 180 range
            while (rotation > 180) rotation -= 360;
            while (rotation < -180) rotation += 360;

            // Keep text readable by constraining to -90 to 90 range
            if (rotation > 90) rotation -= 180;
            if (rotation < -90) rotation += 180;

            textElement.setAttribute('transform', `rotate(${rotation} ${textX} ${textY})`);

            textElement.textContent = displayName;
            svg.appendChild(textElement);
        });

        // Insert SVG into wheel element
        wheelElement.insertBefore(svg, wheelElement.firstChild);

        // Update or create center label
        let center = wheelElement.querySelector('.wheel-center');
        if (!center) {
            center = document.createElement('div');
            center.className = 'wheel-center';
            wheelElement.appendChild(center);
        }
        center.textContent = Storage.getSetting('wheelTitle');
        center.style.zIndex = '15';
    },

    /**
     * Create SVG path for a pie slice
     */
    createPieSlicePath(centerX, centerY, radius, startAngle, endAngle) {
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = centerX + Math.cos(startRad - Math.PI / 2) * radius;
        const y1 = centerY + Math.sin(startRad - Math.PI / 2) * radius;

        const x2 = centerX + Math.cos(endRad - Math.PI / 2) * radius;
        const y2 = centerY + Math.sin(endRad - Math.PI / 2) * radius;

        const largeArc = endAngle - startAngle > 180 ? 1 : 0;

        return `
            M ${centerX} ${centerY}
            L ${x1} ${y1}
            A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
            Z
        `;
    },

    /**
     * Spin the wheel
     */
    spin(onComplete) {
        if (this.isSpinning || this.users.length < 2) return;

        this.isSpinning = true;
        const spinButton = document.getElementById('spin-button');
        if (spinButton) spinButton.disabled = true;

        const settings = Storage.getSettings();
        const duration = settings.spinDuration;
        const speedMultiplier = settings.animationSpeed;

        // Play spinning sound
        Sounds.playSpinning();

        // Calculate random result (preventing same user as last spin)
        const selectedIndex = this.getRandomUserIndex();
        const selectedUser = this.users[selectedIndex];

        // Calculate final rotation
        // We want the selected slice to land on the pointer (at right side, 90 degrees)
        const sliceCenter = selectedIndex * this.sliceAngle + this.sliceAngle / 2;
        const fullRotations = 5;
        const targetRotation = fullRotations * 360 + (90 - sliceCenter);

        // Get rotation direction
        const direction = settings.rotationDirection === 'counter-clockwise' ? -1 : 1;
        const finalRotation = this.currentRotation + targetRotation * direction;

        // Create custom animation duration based on settings and speed multiplier
        const animationDuration = duration * speedMultiplier;

        // Apply spin animation
        const wheelElement = document.getElementById('wheel');
        wheelElement.style.transition = `none`;
        wheelElement.style.transform = `rotate(${this.currentRotation}deg)`;

        // Force reflow to restart animation
        void wheelElement.offsetWidth;

        // Set the animation
        wheelElement.style.transition = `transform ${animationDuration}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        wheelElement.style.transform = `rotate(${finalRotation}deg)`;

        this.currentRotation = finalRotation % 360;

        // Handle completion after animation
        setTimeout(() => {
            Sounds.stopSpinning();
            Sounds.playStop();
            setTimeout(() => {
                Sounds.playFanfare();
            }, 300);

            this.isSpinning = false;
            if (spinButton) spinButton.disabled = false;

            // Highlight the selected slice
            this.highlightSlice(selectedUser.id);

            // Record in history
            Storage.addSpinEntry(selectedUser.id, selectedUser.name);

            // Update browser tab title
            document.title = `${selectedUser.name} | Spinning Wheel`;

            // Call completion callback with result
            if (onComplete) {
                onComplete(selectedUser);
            }
        }, animationDuration * 1000);
    },

    /**
     * Get random user index, preventing same as last selection
     */
    getRandomUserIndex() {
        let index = Math.floor(Math.random() * this.users.length);

        // Check if we need to prevent same user as last spin
        const lastSelectedId = Storage.getLastSelected();
        if (lastSelectedId) {
            const lastIndex = this.users.findIndex(u => u.id === lastSelectedId);
            if (lastIndex !== -1) {
                // Re-roll if same user
                let attempts = 0;
                while (index === lastIndex && attempts < 10) {
                    index = Math.floor(Math.random() * this.users.length);
                    attempts++;
                }
            }
        }

        return index;
    },

    /**
     * Highlight the selected slice
     */
    highlightSlice(userId) {
        // Remove previous highlights
        const svg = document.querySelector('#wheel svg');
        if (svg) {
            svg.querySelectorAll('path').forEach(path => {
                path.style.filter = '';
            });

            // Add highlight to selected slice
            const sliceElement = svg.querySelector(`#slice-${userId}`);
            if (sliceElement) {
                sliceElement.style.filter = 'brightness(1.3)';
            }
        }
    },

    /**
     * Update wheel title
     */
    updateTitle(title) {
        const center = document.querySelector('.wheel-center');
        if (center) {
            center.textContent = title;
        }
    },

    /**
     * Update slice animation effect
     */
    updateSliceAnimation(animation) {
        const svg = document.querySelector('#wheel svg');
        if (svg) {
            svg.querySelectorAll('path').forEach(path => {
                path.classList.remove('pulse', 'glow');
                if (animation !== 'none') {
                    path.classList.add(animation);
                }
            });
        }
    },

    /**
     * Validate wheel can spin
     */
    canSpin() {
        return this.users.length >= 2 && !this.isSpinning;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        Wheel.init();
    });
} else {
    Wheel.init();
}
