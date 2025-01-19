// Global variables
let currentPosition = null;
let mediaRecorder = null;
let audioChunks = [];
let audioBlob = null;
let watchId = null;

const locationStatus = document.createElement('div');
locationStatus.className = 'location-status';
document.querySelector('.sos-section').appendChild(locationStatus);

const sosButton = document.getElementById('sosButton');
const complaintBtn = document.getElementById('complaintBtn');
const complaintModal = document.getElementById('complaintModal');
const closeBtn = document.querySelector('.close');
const complaintForm = document.getElementById('complaintForm');
const incidentTypeSelect = document.getElementById('incidentType');
const vehicleDetailsDiv = document.querySelector('.vehicle-details');
const justHappenedCheckbox = document.getElementById('justHappened');
const timeRangeGroup = document.getElementById('timeRangeGroup');
const textReportBtn = document.getElementById('textReportBtn');
const audioReportBtn = document.getElementById('audioReportBtn');
const recordButton = document.getElementById('recordButton');
const audioPreview = document.getElementById('audioPreview');
const audioPlayer = document.getElementById('audioPlayer');

// Initialize location tracking
function initializeLocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.watchPosition(
            position => {
                currentPosition = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                document.getElementById('location').value = `${currentPosition.latitude}, ${currentPosition.longitude}`;
            },
            error => {
                console.error('Error getting location:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        console.log('Geolocation is not supported by your browser');
    }
}

// Audio recording functions
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            audioPlayer.src = audioUrl;
            audioPreview.style.display = 'block';
            recordButton.textContent = '🎤 Start Recording';
            recordButton.classList.remove('recording');
        };

        mediaRecorder.start();
        recordButton.textContent = '⏹️ Stop Recording';
        recordButton.classList.add('recording');
    } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Could not access microphone. Please check permissions.');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
}

// Handle complaint form submission
async function handleComplaint(event) {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('name', document.getElementById('name').value);
    formData.append('contact', document.getElementById('contact').value);
    formData.append('incidentType', incidentTypeSelect.value);
    formData.append('vehicleNumber', document.getElementById('vehicleNumber').value);
    formData.append('justHappened', justHappenedCheckbox.checked);
    formData.append('timeRange', document.getElementById('timeRange').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('location', JSON.stringify(currentPosition));
    formData.append('timestamp', new Date().toISOString());

    if (audioBlob) {
        formData.append('audio', audioBlob, 'complaint.wav');
    }

    try {
        // In a real application, you would send this to your backend
        console.log('Complaint data:', Object.fromEntries(formData));
        alert('Complaint submitted successfully!');
        
        // Reset form
        complaintForm.reset();
        complaintModal.style.display = 'none';
        audioBlob = null;
        audioPreview.style.display = 'none';
        document.querySelector('.text-report').style.display = 'block';
        document.querySelector('.audio-report').style.display = 'none';
        textReportBtn.classList.add('active');
        audioReportBtn.classList.remove('active');
    } catch (error) {
        console.error('Error submitting complaint:', error);
        alert('Error submitting complaint. Please try again.');
    }
}

// Location sharing functionality
function startLocationSharing() {
    if (!watchId) {
        if ("geolocation" in navigator) {
            locationStatus.textContent = "Getting your location...";
            watchId = navigator.geolocation.watchPosition(
                position => {
                    currentPosition = position;
                    const { latitude, longitude } = position.coords;
                    locationStatus.innerHTML = `
                        Location active<br>
                        <small>Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}</small>
                    `;
                    // Create shareable location link
                    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                    
                    // Try to share the location if supported
                    if (navigator.share) {
                        navigator.share({
                            title: 'Emergency Location',
                            text: 'I need help! Here is my location:',
                            url: mapsUrl
                        }).catch(err => {
                            console.log('Share failed:', err);
                            // Fallback: copy to clipboard
                            navigator.clipboard.writeText(mapsUrl).then(() => {
                                locationStatus.innerHTML += '<br><small>Location link copied to clipboard</small>';
                            });
                        });
                    } else {
                        // Fallback: copy to clipboard
                        navigator.clipboard.writeText(mapsUrl).then(() => {
                            locationStatus.innerHTML += '<br><small>Location link copied to clipboard</small>';
                        });
                    }
                },
                error => {
                    locationStatus.textContent = "Unable to access location. Please enable location services.";
                    console.error("Location error:", error);
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 5000
                }
            );
        } else {
            locationStatus.textContent = "Location sharing is not supported on this device.";
        }
    }
}

function stopLocationSharing() {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        locationStatus.textContent = "Location sharing stopped";
    }
}

// Event Listeners
sosButton.addEventListener('click', async function(e) {
    e.preventDefault();
    startLocationSharing();
    
    // Start emergency call
    try {
        await navigator.serviceWorker.ready;
        window.location.href = 'tel:112';
    } catch (err) {
        console.error('Error making emergency call:', err);
    }
});

textReportBtn.addEventListener('click', () => {
    textReportBtn.classList.add('active');
    audioReportBtn.classList.remove('active');
    document.querySelector('.text-report').style.display = 'block';
    document.querySelector('.audio-report').style.display = 'none';
});

audioReportBtn.addEventListener('click', () => {
    audioReportBtn.classList.add('active');
    textReportBtn.classList.remove('active');
    document.querySelector('.text-report').style.display = 'none';
    document.querySelector('.audio-report').style.display = 'block';
});

recordButton.addEventListener('click', () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        startRecording();
    } else {
        stopRecording();
    }
});

incidentTypeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'vehicle') {
        vehicleDetailsDiv.style.display = 'block';
    } else {
        vehicleDetailsDiv.style.display = 'none';
    }
});

justHappenedCheckbox.addEventListener('change', (e) => {
    timeRangeGroup.style.display = e.target.checked ? 'none' : 'block';
});

complaintBtn.addEventListener('click', () => {
    complaintModal.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    complaintModal.style.display = 'none';
});

complaintForm.addEventListener('submit', handleComplaint);

window.addEventListener('click', (event) => {
    if (event.target === complaintModal) {
        complaintModal.style.display = 'none';
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeLocation();
});
