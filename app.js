// Global variables for emergency state
let isEmergencyActive = false;
let locationWatchId = null;
let mediaRecorder = null;
let audioChunks = [];
let emergencySocket = null; // For real-time data streaming to police server

// DOM Elements
const sosButton = document.querySelector('.sos-button');
const complaintBtn = document.getElementById('complaintBtn');
const complaintModal = document.getElementById('complaintModal');
const closeBtn = document.querySelector('.close');
const complaintForm = document.getElementById('complaintForm');
const locationStatus = document.getElementById('locationStatus');
const audioStatus = document.getElementById('audioStatus');
const callStatus = document.getElementById('callStatus');
const textReportBtn = document.getElementById('textReportBtn');
const audioReportBtn = document.getElementById('audioReportBtn');
const incidentTypeSelect = document.getElementById('incidentType');
const vehicleDetails = document.querySelector('.vehicle-details');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');

    // Initialize event listeners
    function initializeEventListeners() {
        console.log('Initializing event listeners...');

        // SOS Button - Main Emergency Feature
        sosButton.addEventListener('click', function(e) {
            console.log('SOS button clicked');
            e.preventDefault();
            handleEmergency();
        });

        // Complaint Button
        complaintBtn.addEventListener('click', function() {
            console.log('Complaint button clicked');
            complaintModal.style.display = 'block';
        });

        // Close Modal Button
        closeBtn.addEventListener('click', function() {
            console.log('Close button clicked');
            complaintModal.style.display = 'none';
        });

        // Close modal when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === complaintModal) {
                complaintModal.style.display = 'none';
            }
        });

        // Report Type Buttons
        textReportBtn.addEventListener('click', function() {
            console.log('Text report selected');
            switchReportType('text');
        });

        audioReportBtn.addEventListener('click', function() {
            console.log('Audio report selected');
            switchReportType('audio');
        });

        // Incident Type Selection
        incidentTypeSelect.addEventListener('change', function() {
            console.log('Incident type changed:', this.value);
            vehicleDetails.style.display = this.value === 'vehicle' ? 'block' : 'none';
        });

        // Complaint Form Submission
        complaintForm.addEventListener('submit', function(e) {
            console.log('Form submitted');
            handleComplaintSubmission(e);
        });
    }

    // Emergency Functions
    async function handleEmergency() {
        console.log('Handling emergency...');
        if (!isEmergencyActive) {
            startEmergency();
        } else {
            stopEmergency();
        }
    }

    async function startEmergency() {
        try {
            console.log('Starting emergency services...');
            isEmergencyActive = true;
            sosButton.classList.add('active');
            
            // 1. Start Location Tracking
            await startLocationTracking();
            
            // 2. Start Audio Recording
            await startAudioRecording();
            
            // 3. Call Emergency Number
            callEmergencyNumber();
            
            // Update UI
            updateEmergencyStatus('active');
        } catch (error) {
            console.error('Emergency activation failed:', error);
            alert('Failed to activate emergency services. Please call 1090 directly.');
        }
    }

    function stopEmergency() {
        console.log('Stopping emergency services...');
        isEmergencyActive = false;
        sosButton.classList.remove('active');
        
        // Stop all emergency services
        stopLocationTracking();
        stopAudioRecording();
        emergencySocket.close();
        
        // Update UI
        updateEmergencyStatus('inactive');
    }

    // Location Tracking
    async function startLocationTracking() {
        console.log('Starting location tracking...');
        if (!navigator.geolocation) {
            throw new Error('Geolocation not supported');
        }

        locationStatus.innerHTML = '<i class="fas fa-location-dot"></i><span>Activating location...</span>';
        
        try {
            locationWatchId = navigator.geolocation.watchPosition(
                (position) => {
                    console.log('Location updated:', position.coords);
                    const locationData = {
                        type: 'location',
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    };
                    
                    // Send location to police server
                    emergencySocket.send(locationData);
                    locationStatus.innerHTML = '<i class="fas fa-location-dot"></i><span>Location: Active</span>';
                },
                (error) => {
                    console.error('Location error:', error);
                    locationStatus.innerHTML = '<i class="fas fa-location-slash"></i><span>Location failed</span>';
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 5000
                }
            );
        } catch (error) {
            console.error('Location tracking failed:', error);
            locationStatus.innerHTML = '<i class="fas fa-location-slash"></i><span>Location failed</span>';
            throw error;
        }
    }

    function stopLocationTracking() {
        console.log('Stopping location tracking...');
        if (locationWatchId) {
            navigator.geolocation.clearWatch(locationWatchId);
            locationWatchId = null;
        }
        locationStatus.innerHTML = '<i class="fas fa-location-dot"></i><span>Location: Ready</span>';
    }

    // Audio Recording
    async function startAudioRecording() {
        console.log('Starting audio recording...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunks = [];
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                    console.log('Audio chunk recorded');
                    // Send audio chunk to police server
                    emergencySocket.send({
                        type: 'audio',
                        data: event.data,
                        timestamp: new Date().toISOString()
                    });
                }
            };
            
            mediaRecorder.start(1000);
            audioStatus.innerHTML = '<i class="fas fa-microphone"></i><span>Audio: Active</span>';
        } catch (error) {
            console.error('Audio recording failed:', error);
            audioStatus.innerHTML = '<i class="fas fa-microphone-slash"></i><span>Audio failed</span>';
            throw error;
        }
    }

    function stopAudioRecording() {
        console.log('Stopping audio recording...');
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        audioStatus.innerHTML = '<i class="fas fa-microphone"></i><span>Audio: Ready</span>';
    }

    // Emergency Call
    function callEmergencyNumber() {
        console.log('Initiating emergency call...');
        callStatus.innerHTML = '<i class="fas fa-phone"></i><span>Calling 1090...</span>';
        
        // Initiate call to emergency number
        window.location.href = 'tel:1090';
        
        // Update status after small delay to show call initiation
        setTimeout(() => {
            callStatus.innerHTML = '<i class="fas fa-phone"></i><span>Call: Connected</span>';
        }, 1000);
    }

    // Update Emergency Status UI
    function updateEmergencyStatus(status) {
        const statusContainer = document.querySelector('.status-container');
        if (statusContainer) {
            statusContainer.classList.toggle('active', status === 'active');
        }
    }

    // Complaint Functions
    function switchReportType(type) {
        console.log('Switching report type to:', type);
        const textContent = document.querySelector('.text-content');
        const audioContent = document.querySelector('.audio-content');
        
        textReportBtn.classList.toggle('active', type === 'text');
        audioReportBtn.classList.toggle('active', type === 'audio');
        
        if (textContent && audioContent) {
            textContent.style.display = type === 'text' ? 'block' : 'none';
            audioContent.style.display = type === 'audio' ? 'block' : 'none';
        }
    }

    async function handleComplaintSubmission(event) {
        event.preventDefault();
        console.log('Handling complaint submission...');
        
        const formData = new FormData(complaintForm);
        
        try {
            // In a real implementation, this would send to police server
            console.log('Complaint data:', Object.fromEntries(formData));
            alert('Complaint submitted successfully. The police will contact you shortly.');
            complaintForm.reset();
            complaintModal.style.display = 'none';
        } catch (error) {
            console.error('Complaint submission failed:', error);
            alert('Failed to submit complaint. Please try again or contact 1090 directly.');
        }
    }

    // Emergency Socket Setup (simulated)
    function setupEmergencySocket() {
        // In a real implementation, this would connect to police server
        emergencySocket = {
            send: (data) => {
                console.log('Emergency data sent to police:', data);
            },
            close: () => {
                console.log('Emergency connection closed');
            }
        };
    }

    // Initialize the app
    initializeEventListeners();
    setupEmergencySocket();
    console.log('App initialization complete');
});
