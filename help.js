// Help Modal Functionality
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const closeModal = document.getElementById('closeModal');
const fileInput = document.getElementById('screenshot');
const previewImage = document.getElementById('previewImage');
const helpForm = document.getElementById('helpForm');
const submitButton = document.getElementById('submitButton');
const statusSuccess = document.getElementById('statusSuccess');
const statusError = document.getElementById('statusError');
const statusLoading = document.getElementById('statusLoading');

// Open modal
helpBtn.addEventListener('click', () => {
    console.log('Help button clicked');
    // Reset status messages
    statusSuccess.style.display = 'none';
    statusError.style.display = 'none';
    statusLoading.style.display = 'none';
    
    // Enable submit button
    submitButton.disabled = false;
    
    // Show modal
    helpModal.style.display = 'flex';
});

// Close modal
closeModal.addEventListener('click', () => {
    console.log('Close modal button clicked');
    helpModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === helpModal) {
        console.log('Clicked outside modal');
        helpModal.style.display = 'none';
    }
});

// Preview uploaded image
fileInput.addEventListener('change', (event) => {
    console.log('File selected');
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
            console.log('Image preview displayed');
        };
        reader.readAsDataURL(file);
    }
});

// Form submission handling
helpForm.addEventListener('submit', (event) => {
    console.log('Form submitted');
    // Check if the form is valid
    if (!helpForm.checkValidity()) {
        console.log('Form validation failed');
        return;
    }
    
    // Show loading state
    statusLoading.style.display = 'flex';
    submitButton.disabled = true;
    console.log('Loading indicator displayed');
    
    // The form will be submitted naturally to FormSubmit
});

// Execute when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    // Make sure buttons are clickable by setting z-index
    document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
        btn.style.position = 'relative';
        btn.style.zIndex = '10';
        console.log(`Enhanced button: ${btn.textContent.trim()}`);
    });
});