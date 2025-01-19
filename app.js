// Global variables
let currentPosition = null;
let watchId = null;
let liveAudioStream = null;
let mediaRecorder = null;
let audioChunks = [];
let isEmergencyActive = false;
let audioBlob = null;

const locationStatusEl = document.getElementById('locationStatus');
const audioStatusEl = document.getElementById('audioStatus');
const callStatusEl = document.getElementById('callStatus');

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

// Live audio sharing functionality
async function startLiveAudio() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        liveAudioStream = stream;
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.start(1000);
        audioStatusEl.innerHTML = `
            <i class="fas fa-microphone"></i>
            <span>Audio: Active</span>
        `;
        audioStatusEl.classList.add('active');
    } catch (err) {
        console.error('Error accessing microphone:', err);
        audioStatusEl.innerHTML = `
            <i class="fas fa-microphone-slash"></i>
            <span>Audio: Failed</span>
        `;
    }
}

function stopLiveAudio() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    if (liveAudioStream) {
        liveAudioStream.getTracks().forEach(track => track.stop());
    }
    audioStatusEl.innerHTML = `
        <i class="fas fa-microphone"></i>
        <span>Audio: Stopped</span>
    `;
    audioStatusEl.classList.remove('active');
    audioChunks = [];
}

// Location sharing functionality
function startLocationSharing() {
    if (!watchId) {
        if ("geolocation" in navigator) {
            locationStatusEl.innerHTML = `
                <i class="fas fa-location-dot"></i>
                <span>Location: Getting...</span>
            `;
            
            watchId = navigator.geolocation.watchPosition(
                position => {
                    currentPosition = position;
                    const { latitude, longitude } = position.coords;
                    locationStatusEl.innerHTML = `
                        <i class="fas fa-location-dot"></i>
                        <span>Location: Active</span>
                    `;
                    locationStatusEl.classList.add('active');
                    
                    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                    
                    if (navigator.share) {
                        navigator.share({
                            title: 'Emergency Location',
                            text: 'I need help! Here is my location:',
                            url: mapsUrl
                        }).catch(err => {
                            console.log('Share failed:', err);
                            navigator.clipboard.writeText(mapsUrl);
                        });
                    } else {
                        navigator.clipboard.writeText(mapsUrl);
                    }
                },
                error => {
                    locationStatusEl.innerHTML = `
                        <i class="fas fa-location-slash"></i>
                        <span>Location: Failed</span>
                    `;
                    console.error("Location error:", error);
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 5000
                }
            );
        } else {
            locationStatusEl.innerHTML = `
                <i class="fas fa-location-slash"></i>
                <span>Location: Not supported</span>
            `;
        }
    }
}

function stopLocationSharing() {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        locationStatusEl.innerHTML = `
            <i class="fas fa-location-dot"></i>
            <span>Location: Stopped</span>
        `;
        locationStatusEl.classList.remove('active');
    }
}

// Handle emergency state
function startEmergency() {
    isEmergencyActive = true;
    document.querySelector('.sos-button').classList.add('active');
    startLocationSharing();
    startLiveAudio();
    callStatusEl.innerHTML = `
        <i class="fas fa-phone"></i>
        <span>Calling 1090...</span>
    `;
    callStatusEl.classList.add('active');
}

function stopEmergency() {
    isEmergencyActive = false;
    document.querySelector('.sos-button').classList.remove('active');
    stopLocationSharing();
    stopLiveAudio();
    callStatusEl.innerHTML = `
        <i class="fas fa-phone"></i>
        <span>Call: Ready</span>
    `;
    callStatusEl.classList.remove('active');
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

// SOS Button Event Listener
sosButton.addEventListener('click', async function(e) {
    e.preventDefault();
    
    if (!isEmergencyActive) {
        startEmergency();
        try {
            await navigator.serviceWorker.ready;
            window.location.href = 'tel:1090';
        } catch (err) {
            console.error('Error making emergency call:', err);
        }
    } else {
        stopEmergency();
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

// Complaint Form Location Handling
const locationInput = document.getElementById('location');
const useCurrentLocationBtn = document.createElement('button');
useCurrentLocationBtn.type = 'button';
useCurrentLocationBtn.className = 'use-location-btn';
useCurrentLocationBtn.textContent = 'Use Current Location';
locationInput.parentNode.insertBefore(useCurrentLocationBtn, locationInput.nextSibling);

useCurrentLocationBtn.addEventListener('click', () => {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                locationInput.value = `${latitude}, ${longitude}`;
            },
            error => {
                console.error("Location error:", error);
                alert("Unable to get location. Please enter manually.");
            }
        );
    } else {
        alert("Location services not available. Please enter location manually.");
    }
});

// Share button functionality
document.getElementById('shareBtn').addEventListener('click', async () => {
    const shareData = {
        title: 'Women Safety App',
        text: 'Install our Women Safety Emergency App',
        url: 'https://21pk.github.io/Women_safety/'
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(shareData.url);
            alert('App link copied to clipboard!');
        }
    } catch (err) {
        console.error('Error sharing:', err);
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeLocation();
});
