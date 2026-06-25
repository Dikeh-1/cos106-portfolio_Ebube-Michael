document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    
    // Inputs
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const messageInput = document.getElementById('message');
    
    // Error messages
    const nameError = document.getElementById('name-error');
    const emailError = document.getElementById('email-error');
    const phoneError = document.getElementById('phone-error');
    const messageError = document.getElementById('message-error');

    const successMessage = document.getElementById('success-banner');

    // Initialize intl-tel-input
    const iti = window.intlTelInput(phoneInput, {
        utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.12/build/js/utils.js",
        initialCountry: "auto",
        geoIpLookup: function(callback) {
            fetch("https://ipapi.co/json")
            .then(res => res.json())
            .then(data => callback(data.country_code))
            .catch(() => callback("ng")); // Default to Nigeria
        },
        showSelectedDialCode: true,
        strictMode: true
    });

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent actual form submission

        let isValid = true;

        // Reset errors
        nameError.style.display = 'none';
        emailError.style.display = 'none';
        phoneError.style.display = 'none';
        messageError.style.display = 'none';
        successMessage.style.display = 'none';

        // 1. Validate Name (Not empty)
        if (nameInput.value.trim() === '') {
            nameError.style.display = 'block';
            isValid = false;
        }

        // 2. Strict Email Validation & Domain Blacklist
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const fakeDomains = ['example.com', 'test.com', 'fake.com', 'mailinator.com', '123.com', 'abc.com', 'asd.com', 'spam.com'];
        const emailVal = emailInput.value.trim().toLowerCase();
        const domain = emailVal.includes('@') ? emailVal.split('@')[1] : '';

        if (emailVal === '' || !emailPattern.test(emailVal) || fakeDomains.includes(domain)) {
            emailError.textContent = "Please provide a valid, real email address.";
            emailError.style.display = 'block';
            isValid = false;
        }

        // 3. Validate Phone (Not empty and strictly digits only as per rubric)
        const rawPhone = phoneInput.value.trim().replace(/[\s+()-]/g, ''); // strip formatting
        const digitsOnlyPattern = /^\d+$/;
        
        if (phoneInput.value.trim() === '' || !digitsOnlyPattern.test(rawPhone) || !iti.isValidNumber()) {
            phoneError.textContent = "Please enter a valid phone number containing only digits.";
            phoneError.style.display = 'block';
            isValid = false;
        }

        // 4. Validate Message (Not empty)
        if (messageInput.value.trim() === '') {
            messageError.style.display = 'block';
            isValid = false;
        }

        // If all valid, redirect to WhatsApp and show success message
        if (isValid) {
            const name = encodeURIComponent(nameInput.value.trim());
            const email = encodeURIComponent(emailInput.value.trim());
            const phone = encodeURIComponent(iti.getNumber()); // Get properly formatted international number
            const message = encodeURIComponent(messageInput.value.trim());
            
            const waText = `Hello! New message from portfolio:%0A%0A*Name:* ${name}%0A*Email:* ${email}%0A*Phone:* ${phone}%0A*Message:* ${message}`;
            const waUrl = `https://wa.me/2347046078162?text=${waText}`;
            
            // Open WhatsApp in a new tab
            window.open(waUrl, '_blank');
            
            successMessage.style.display = 'block';
            contactForm.reset(); // Clear the form
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 5000);
        }
    });
});
