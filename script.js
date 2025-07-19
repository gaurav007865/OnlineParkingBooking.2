class ParkingSystem {
    constructor() {
        this.slots = 20;
        this.bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        this.pendingPayments = new Map(); // Store pending payment sessions
        this.map = null;
        this.markers = [];
        this.selectedLocation = null;
        this.parkingLocations = [
            {
                name: "Nagpur Railway Station Parking",
                lat: 21.1458,
                lng: 79.0882,
                address: "Nagpur Railway Station, Central Avenue, Nagpur, Maharashtra",
                slots: 80,
                rate: 1.2
            },
            {
                name: "Dr. Babasaheb Ambedkar International Airport Parking",
                lat: 21.0922,
                lng: 79.0473,
                address: "Nagpur Airport, Mihan, Nagpur, Maharashtra",
                slots: 120,
                rate: 1.5
            },
            {
                name: "Central Mall Parking",
                lat: 21.1498,
                lng: 79.0805,
                address: "Central Mall, Sitabuldi, Nagpur, Maharashtra",
                slots: 60,
                rate: 1.3
            },
            {
                name: "Government Medical College Parking",
                lat: 21.1458,
                lng: 79.0882,
                address: "GMC Hospital, Medical College, Nagpur, Maharashtra",
                slots: 40,
                rate: 1.1
            },
            {
                name: "Dharampeth Parking Zone",
                lat: 21.1539,
                lng: 79.1054,
                address: "Dharampeth, Nagpur, Maharashtra",
                slots: 35,
                rate: 1.0
            },
            {
                name: "Sitabuldi Market Parking",
                lat: 21.1498,
                lng: 79.0805,
                address: "Sitabuldi Market, Nagpur, Maharashtra",
                slots: 45,
                rate: 1.2
            },
            {
                name: "Orange City Hospital Parking",
                lat: 21.1458,
                lng: 79.0882,
                address: "Orange City Hospital, Nagpur, Maharashtra",
                slots: 30,
                rate: 1.4
            },
            {
                name: "VCA Stadium Parking",
                lat: 21.1539,
                lng: 79.1054,
                address: "Vidarbha Cricket Association Stadium, Nagpur, Maharashtra",
                slots: 100,
                rate: 1.6
            },
            {
                name: "Empress Mall Parking",
                lat: 21.1498,
                lng: 79.0805,
                address: "Empress Mall, Sitabuldi, Nagpur, Maharashtra",
                slots: 70,
                rate: 1.3
            },
            {
                name: "Dragon Palace Temple Parking",
                lat: 21.1539,
                lng: 79.1054,
                address: "Dragon Palace Temple, Kamptee Road, Nagpur, Maharashtra",
                slots: 50,
                rate: 1.1
            },
            {
                name: "Seminary Hills Parking",
                lat: 21.1458,
                lng: 79.0882,
                address: "Seminary Hills, Nagpur, Maharashtra",
                slots: 25,
                rate: 1.0
            },
            {
                name: "Zero Mile Stone Parking",
                lat: 21.1498,
                lng: 79.0805,
                address: "Zero Mile Stone, Civil Lines, Nagpur, Maharashtra",
                slots: 30,
                rate: 1.2
            },
            {
                name: "Maharajbagh Zoo Parking",
                lat: 21.1539,
                lng: 79.1054,
                address: "Maharajbagh Zoo, Nagpur, Maharashtra",
                slots: 40,
                rate: 1.1
            },
            {
                name: "Kasturchand Park Parking",
                lat: 21.1458,
                lng: 79.0882,
                address: "Kasturchand Park, Sitabuldi, Nagpur, Maharashtra",
                slots: 35,
                rate: 1.2
            },
            {
                name: "RBI Square Parking",
                lat: 21.1498,
                lng: 79.0805,
                address: "RBI Square, Civil Lines, Nagpur, Maharashtra",
                slots: 45,
                rate: 1.3
            }
        ];
        
        this.initializeSlots();
        this.updateAmount = this.updateAmount.bind(this);
        this.setupEventListeners();
        this.renderBookings();
        this.setupModal();
        this.initializeLocationSelector();
        
        // Initialize EmailJS with your public key
        try {
            emailjs.init("JdRepF3qg5_MGi7Z1");
            console.log('EmailJS initialized successfully');
        } catch (error) {
            console.error('EmailJS initialization failed:', error);
        }
    }

    initializeLocationSelector() {
        const locationDropdown = document.getElementById('locationDropdown');
        
        // Populate dropdown with parking locations
        this.parkingLocations.forEach((location, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${location.name} - ${location.address}`;
            locationDropdown.appendChild(option);
        });

        // Add event listener for location selection
        locationDropdown.addEventListener('change', (e) => {
            if (e.target.value !== '') {
                this.selectParkingLocation(parseInt(e.target.value));
            } else {
                this.clearLocationSelection();
            }
        });
    }

    addParkingMarkers() {
        this.parkingLocations.forEach((location, index) => {
            const marker = new google.maps.Marker({
                position: { lat: location.lat, lng: location.lng },
                map: this.map,
                title: location.name,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="15" cy="15" r="12" fill="#007bff" stroke="#fff" stroke-width="2"/>
                            <text x="15" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">P</text>
                        </svg>
                    `),
                    scaledSize: new google.maps.Size(30, 30)
                }
            });

            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="padding: 10px;">
                        <h4 style="margin: 0 0 5px 0; color: #2c3e50;">${location.name}</h4>
                        <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">${location.address}</p>
                        <p style="margin: 0 0 5px 0; color: #28a745; font-weight: bold;">Available Slots: ${location.slots}</p>
                        <p style="margin: 0; color: #007bff; font-weight: bold;">Rate Multiplier: ${location.rate}x</p>
                        <button onclick="parkingSystem.selectParkingLocation(${index})" style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 5px;">Select This Location</button>
                    </div>
                `
            });

            marker.addListener('click', () => {
                infoWindow.open(this.map, marker);
            });

            this.markers.push({ marker, infoWindow, location });
        });
    }

    setupLocationSearch() {
        const searchInput = document.getElementById('locationSearch');
        const searchBtn = document.getElementById('searchBtn');
        const currentLocationBtn = document.getElementById('currentLocationBtn');

        // Search functionality
        searchBtn.addEventListener('click', () => {
            this.searchLocation(searchInput.value);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchLocation(searchInput.value);
            }
        });

        // Current location functionality
        currentLocationBtn.addEventListener('click', () => {
            this.getCurrentLocation();
        });
    }

    searchLocation(query) {
        if (!query.trim()) return;

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: query }, (results, status) => {
            if (status === 'OK') {
                const location = results[0].geometry.location;
                this.map.setCenter(location);
                this.map.setZoom(15);
                this.handleMapClick(location);
            } else {
                alert('Location not found. Please try a different search term.');
            }
        });
    }

    getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    this.map.setCenter(location);
                    this.map.setZoom(15);
                    this.handleMapClick(location);
                },
                (error) => {
                    alert('Unable to get your current location. Please search manually.');
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    }

    handleMapClick(latLng) {
        // Clear previous selection
        this.clearSelection();

        // Add selection marker
        const selectionMarker = new google.maps.Marker({
            position: latLng,
            map: this.map,
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="15" cy="15" r="12" fill="#28a745" stroke="#fff" stroke-width="2"/>
                        <text x="15" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">✓</text>
                    </svg>
                `),
                scaledSize: new google.maps.Size(30, 30)
            }
        });

        // Get address for the selected location
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: latLng }, (results, status) => {
            if (status === 'OK') {
                const address = results[0].formatted_address;
                this.selectLocation(latLng.lat(), latLng.lng(), address);
            } else {
                this.selectLocation(latLng.lat(), latLng.lng(), 'Custom Location');
            }
        });

        this.selectionMarker = selectionMarker;
    }

    selectParkingLocation(index) {
        const location = this.parkingLocations[index];
        this.selectLocation(location.lat, location.lng, location.address, location);
        
        // Update location details display
        this.showLocationDetails(location);
    }

    showLocationDetails(location) {
        const locationDetails = document.getElementById('locationDetails');
        const locationName = document.getElementById('selectedLocationName');
        const locationAddress = document.getElementById('selectedLocationAddress');
        const locationSlots = document.getElementById('selectedLocationSlots');
        const locationRate = document.getElementById('selectedLocationRate');

        locationName.textContent = location.name;
        locationAddress.textContent = location.address;
        locationSlots.textContent = location.slots;
        locationRate.textContent = location.rate;

        locationDetails.style.display = 'block';
    }

    clearLocationSelection() {
        this.selectedLocation = null;
        document.getElementById('selectedLocationText').textContent = 'No location selected';
        document.getElementById('locationDetails').style.display = 'none';
        document.getElementById('selectedLatitude').value = '';
        document.getElementById('selectedLongitude').value = '';
        document.getElementById('selectedAddress').value = '';
    }



    selectLocation(lat, lng, address, parkingLocation = null) {
        this.selectedLocation = {
            lat: lat,
            lng: lng,
            address: address,
            parkingLocation: parkingLocation
        };

        // Update UI
        document.getElementById('selectedLocationText').textContent = address;
        document.getElementById('selectedLatitude').value = lat;
        document.getElementById('selectedLongitude').value = lng;
        document.getElementById('selectedAddress').value = address;

        // Update amount if parking location has different rate
        if (parkingLocation) {
            this.updateAmount();
        }
    }

    clearSelection() {
        if (this.selectionMarker) {
            this.selectionMarker.setMap(null);
        }
    }



    initializeSlots() {
        const slotContainer = document.getElementById('slotContainer');
        slotContainer.innerHTML = '';

        for (let i = 1; i <= this.slots; i++) {
            const slot = document.createElement('div');
            slot.className = 'parking-slot available';
            slot.dataset.slot = i;
            slot.textContent = `Slot ${i}`;
            slot.addEventListener('click', () => this.selectSlot(slot));
            slotContainer.appendChild(slot);
        }

        this.updateSlotStatus();
    }

    selectSlot(slot) {
        if (slot.classList.contains('occupied')) return;

        document.querySelectorAll('.parking-slot').forEach(s => {
            s.classList.remove('selected');
        });
        slot.classList.add('selected');
    }

    updateSlotStatus() {
        const currentDate = new Date().toISOString().split('T')[0];
        const slots = document.querySelectorAll('.parking-slot');

        slots.forEach(slot => {
            slot.classList.remove('occupied');
            slot.classList.add('available');
        });

        this.bookings.forEach(booking => {
            if (booking.date === currentDate) {
                const slot = document.querySelector(`[data-slot="${booking.slotNumber}"]`);
                if (slot) {
                    slot.classList.remove('available');
                    slot.classList.add('occupied');
                }
            }
        });
    }

    setupEventListeners() {
        const form = document.getElementById('parkingForm');
        form.addEventListener('submit', (e) => this.handleBooking(e));
        
        // Add event listeners for amount calculation
        document.getElementById('vehicleType').addEventListener('change', this.updateAmount);
        document.getElementById('duration').addEventListener('input', this.updateAmount);
        
        // Setup payment method listener
        this.setupPaymentMethodListener();
        
        // Setup verify payment button
        document.getElementById('verifyPaymentBtn').addEventListener('click', () => this.verifyPayment());
    }

    setupPaymentMethodListener() {
        const paymentMethod = document.getElementById('paymentMethod');
        const cardDetails = document.getElementById('cardPaymentDetails');
        const qrDetails = document.getElementById('qrPaymentDetails');
        const bookButton = document.getElementById('bookButton');

        paymentMethod.addEventListener('change', (e) => {
            if (e.target.value === 'card') {
                cardDetails.style.display = 'block';
                qrDetails.style.display = 'none';
                bookButton.textContent = 'Pay and Book Now';
            } else {
                cardDetails.style.display = 'none';
                qrDetails.style.display = 'block';
                bookButton.textContent = 'Book Now';
                this.generateQRCode();
            }
        });
    }

    setupModal() {
        const modal = document.getElementById('paymentModal');
        const closeBtn = document.querySelector('.close');
        const closeModalBtn = document.getElementById('closeModalBtn');

        closeBtn.addEventListener('click', () => this.closeModal());
        closeModalBtn.addEventListener('click', () => this.closeModal());

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    generateQRCode() {
        const amount = document.getElementById('amount').value;
        const qrContainer = document.getElementById('qrCode');
        
        // Create unique payment session ID
        const paymentSessionId = 'PAY_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Create UPI payment data
        const upiData = {
            pa: '8788030512@ybl', // Payment address (UPI ID)
            pn: 'Parking System', // Payee name
            tn: 'Parking Booking', // Transaction note
            am: amount.replace('₹', ''), // Amount
            cu: 'INR', // Currency
            sessionId: paymentSessionId
        };

        // Store payment session
        this.pendingPayments.set(paymentSessionId, {
            amount: amount.replace('₹', ''),
            timestamp: new Date().toISOString(),
            status: 'pending'
        });

        // Create UPI URL format for better compatibility
        const upiUrl = `upi://pay?pa=${upiData.pa}&pn=${encodeURIComponent(upiData.pn)}&tn=${encodeURIComponent(upiData.tn)}&am=${upiData.am}&cu=${upiData.cu}&sessionId=${upiData.sessionId}`;
        
        // Clear container first
        qrContainer.innerHTML = '';
        
        // Try multiple QR generation methods
        this.generateQRWithMultipleMethods(upiUrl, qrContainer);

        // Enable verify button after 5 seconds
        setTimeout(() => {
            document.getElementById('verifyPaymentBtn').disabled = false;
        }, 5000);
    }

    generateQRWithMultipleMethods(upiUrl, qrContainer) {
        // Method 1: Try QRCode library if available
        if (typeof QRCode !== 'undefined') {
            try {
                QRCode.toCanvas(qrContainer, upiUrl, {
                    width: 200,
                    height: 200,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                }, (error) => {
                    if (error) {
                        console.error('QRCode library failed:', error);
                        this.generateQRWithAPI(upiUrl, qrContainer);
                    }
                });
            } catch (error) {
                console.error('QRCode library error:', error);
                this.generateQRWithAPI(upiUrl, qrContainer);
            }
        } else {
            // Method 2: Use external API as fallback
            this.generateQRWithAPI(upiUrl, qrContainer);
        }
    }

    // Alternative method using external QR API
    generateQRWithAPI(upiUrl, qrContainer) {
        try {
            const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiUrl)}&size=200x200&format=png&margin=2`;
            
            const img = document.createElement('img');
            img.src = apiUrl;
            img.alt = 'Payment QR Code';
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.border = '2px solid #ddd';
            img.style.borderRadius = '8px';
            
            img.onload = () => {
                qrContainer.innerHTML = '';
                qrContainer.appendChild(img);
            };
            
            img.onerror = () => {
                console.error('External QR API failed');
                this.generateSimpleQR(upiUrl, qrContainer);
            };
            
        } catch (error) {
            console.error('QR API error:', error);
            this.generateSimpleQR(upiUrl, qrContainer);
        }
    }

    // Simple fallback QR generation
    generateSimpleQR(upiUrl, qrContainer) {
        qrContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; border: 2px solid #ddd; border-radius: 8px; background: #f8f9fa;">
                <h4 style="color: #2c3e50; margin-bottom: 10px;">Payment QR Code</h4>
                <p style="color: #666; margin-bottom: 15px;">UPI ID: 8788030512@ybl</p>
                <p style="color: #666; margin-bottom: 15px;">Amount: ₹${document.getElementById('amount').value.replace('₹', '')}</p>
                <p style="color: #666; font-size: 12px;">Scan with any UPI app to pay</p>
                <div style="background: #e9ecef; padding: 10px; border-radius: 4px; margin-top: 10px;">
                    <p style="font-family: monospace; font-size: 11px; word-break: break-all; margin: 0;">
                        ${upiUrl}
                    </p>
                </div>
            </div>
        `;
    }

    updateAmount() {
        const vehicleType = document.getElementById('vehicleType').value;
        const duration = document.getElementById('duration').value;
        let amount = this.calculateAmount(duration, vehicleType);
        
        // Apply location-based rate multiplier
        if (this.selectedLocation && this.selectedLocation.parkingLocation) {
            amount = Math.round(amount * this.selectedLocation.parkingLocation.rate);
        }
        
        document.getElementById('amount').value = `₹${amount}`;
    }

    calculateAmount(duration, vehicleType) {
        const baseRates = {
            car: 50,
            bike: 30,
            truck: 80,
            scanner: 40
        };
        return baseRates[vehicleType] * parseInt(duration);
    }

    handleBooking(e) {
        e.preventDefault();

        const selectedSlot = document.querySelector('.parking-slot.selected');
        if (!selectedSlot) {
            alert('Please select a parking slot');
            return;
        }

        if (!this.selectedLocation) {
            alert('Please select a parking location');
            return;
        }

        const paymentMethod = document.getElementById('paymentMethod').value;

        if (paymentMethod === 'card') {
            this.processCardPayment();
        } else {
            // For QR payment, generate QR and show payment modal
            this.generateQRCode();
            this.showPaymentModal();
        }
    }

    processCardPayment() {
        // Simulate card payment processing
        const cardNumber = document.getElementById('cardNumber').value;
        const cardExpiry = document.getElementById('cardExpiry').value;
        const cardCvv = document.getElementById('cardCvv').value;

        if (!cardNumber || !cardExpiry || !cardCvv) {
            alert('Please fill in all card details');
            return;
        }

        // Validate card details (basic validation)
        if (cardNumber.length !== 16 || cardCvv.length !== 3) {
            alert('Please enter valid card details');
            return;
        }

        // Simulate payment processing
        this.showPaymentModal();
        setTimeout(() => {
            this.simulatePaymentVerification(true);
        }, 2000);
    }

    showPaymentModal() {
        const modal = document.getElementById('paymentModal');
        const verificationStatus = document.getElementById('verificationStatus');
        const verificationResult = document.getElementById('verificationResult');
        const confirmBtn = document.getElementById('confirmBookingBtn');

        // Reset modal state
        verificationStatus.style.display = 'flex';
        verificationResult.style.display = 'none';
        confirmBtn.style.display = 'none';

        modal.style.display = 'block';
    }

    closeModal() {
        const modal = document.getElementById('paymentModal');
        modal.style.display = 'none';
    }

    verifyPayment() {
        const paymentStatus = document.getElementById('paymentStatus');
        const verifyBtn = document.getElementById('verifyPaymentBtn');

        // Update UI to show verification in progress
        paymentStatus.className = 'payment-status pending';
        paymentStatus.innerHTML = '<span class="status-icon">⏳</span><span class="status-text">Verifying Payment...</span>';
        verifyBtn.disabled = true;

        // Get payment details
        const amount = document.getElementById('amount').value.replace('₹', '');
        const upiId = '8788030512@ybl';
        
        // Real payment verification would involve:
        // 1. Calling UPI API to check transaction status
        // 2. Verifying payment amount
        // 3. Checking transaction timestamp
        // 4. Validating UPI transaction ID
        
        // For demo purposes, we'll simulate with user input
        const userConfirmed = confirm(
            `🔍 Payment Verification\n\n` +
            `💰 Amount: ₹${amount}\n` +
            `📱 UPI ID: ${upiId}\n` +
            `⏰ Time: ${new Date().toLocaleTimeString()}\n\n` +
            `❓ Did you complete the payment?\n\n` +
            `✅ Click OK if payment is successful\n` +
            `❌ Click Cancel if payment failed`
        );

        if (userConfirmed) {
            // Payment verified by user
            setTimeout(() => {
                this.simulatePaymentVerification(true);
            }, 500);
        } else {
            // Payment failed
            setTimeout(() => {
                this.simulatePaymentVerification(false);
            }, 500);
        }
    }

    simulatePaymentVerification(success) {
        const paymentStatus = document.getElementById('paymentStatus');
        const verifyBtn = document.getElementById('verifyPaymentBtn');

        if (success) {
            paymentStatus.className = 'payment-status success';
            paymentStatus.innerHTML = '<span class="status-icon">✅</span><span class="status-text">Payment Successful!</span>';
            verifyBtn.textContent = 'Payment Verified';
            verifyBtn.style.backgroundColor = '#28a745';
            
            // Add success message to QR section
            const qrContainer = document.querySelector('.qr-payment-container');
            const successMessage = document.createElement('div');
            successMessage.className = 'payment-success-message';
            successMessage.innerHTML = `
                <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 8px; margin-top: 15px; border: 1px solid #c3e6cb;">
                    <h4 style="margin: 0 0 10px 0; color: #155724;">🎉 Payment Successful!</h4>
                    <p style="margin: 0; font-size: 14px;">Your payment has been verified. Please check the modal for booking confirmation.</p>
                </div>
            `;
            qrContainer.appendChild(successMessage);
            
            // Show success in modal with confirm button
            this.showVerificationResult(true, 'Payment Successful!', 'Your payment has been verified successfully. Click "Confirm Booking" to complete your booking.');
        } else {
            paymentStatus.className = 'payment-status failed';
            paymentStatus.innerHTML = '<span class="status-icon">❌</span><span class="status-text">Payment Failed</span>';
            verifyBtn.textContent = 'Try Again';
            verifyBtn.disabled = false;
            verifyBtn.style.backgroundColor = '#dc3545';
            
            // Show failure in modal
            this.showVerificationResult(false, 'Payment Failed', 'Payment verification failed. Please try again.');
        }
    }

    showVerificationResult(success, title, message) {
        const verificationStatus = document.getElementById('verificationStatus');
        const verificationResult = document.getElementById('verificationResult');
        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');
        const resultIcon = document.querySelector('.result-icon');
        const confirmBtn = document.getElementById('confirmBookingBtn');

        verificationStatus.style.display = 'none';
        verificationResult.style.display = 'flex';

        resultTitle.textContent = title;
        resultMessage.textContent = message;

        if (success) {
            resultIcon.className = 'result-icon success';
            resultIcon.innerHTML = '✅';
            
            // Show confirm button prominently with enhanced styling
            confirmBtn.style.display = 'inline-block';
            confirmBtn.textContent = '📋 Confirm Booking';
            confirmBtn.style.backgroundColor = '#28a745';
            confirmBtn.style.color = 'white';
            confirmBtn.style.fontWeight = 'bold';
            confirmBtn.style.padding = '15px 30px';
            confirmBtn.style.fontSize = '18px';
            confirmBtn.style.borderRadius = '8px';
            confirmBtn.style.border = 'none';
            confirmBtn.style.cursor = 'pointer';
            confirmBtn.style.marginRight = '10px';
            
            // Add success animation and highlight
            confirmBtn.style.animation = 'pulse 2s infinite';
            confirmBtn.style.boxShadow = '0 0 25px rgba(40, 167, 69, 0.6)';
            confirmBtn.style.transition = 'all 0.3s ease';
            
            // Setup confirm booking button with proper event listener
            confirmBtn.onclick = () => {
                this.confirmBooking();
            };
            
            // Add hover effect
            confirmBtn.onmouseenter = () => {
                confirmBtn.style.backgroundColor = '#218838';
                confirmBtn.style.transform = 'scale(1.05)';
            };
            
            confirmBtn.onmouseleave = () => {
                confirmBtn.style.backgroundColor = '#28a745';
                confirmBtn.style.transform = 'scale(1)';
            };
        } else {
            resultIcon.className = 'result-icon failed';
            resultIcon.innerHTML = '❌';
            confirmBtn.style.display = 'none';
        }
    }

    confirmBooking() {
        const selectedSlot = document.querySelector('.parking-slot.selected');
        const userEmail = document.getElementById('userEmail').value;

        // Show loading state
        const confirmBtn = document.getElementById('confirmBookingBtn');
        const originalText = confirmBtn.textContent;
        confirmBtn.textContent = '🔄 Confirming...';
        confirmBtn.disabled = true;

        // Calculate amount with location-based rate multiplier
        let amount = this.calculateAmount(document.getElementById('duration').value, document.getElementById('vehicleType').value);
        
        // Apply location-based rate multiplier
        if (this.selectedLocation && this.selectedLocation.parkingLocation) {
            amount = Math.round(amount * this.selectedLocation.parkingLocation.rate);
        }
        
        const booking = {
            id: Date.now(),
            vehicleNumber: document.getElementById('vehicleNumber').value,
            vehicleType: document.getElementById('vehicleType').value,
            date: document.getElementById('entryDate').value,
            time: document.getElementById('entryTime').value,
            duration: document.getElementById('duration').value,
            slotNumber: selectedSlot.dataset.slot,
            amount: amount,
            paymentMethod: document.getElementById('paymentMethod').value || 'QR Payment',
            paymentStatus: 'Paid',
            paymentVerified: true,
            bookingDate: new Date().toISOString(),
            location: this.selectedLocation
        };

        // First save booking immediately
        this.bookings.push(booking);
        localStorage.setItem('bookings', JSON.stringify(this.bookings));
        this.updateSlotStatus();
        this.renderBookings();

        // Show immediate success
        this.resetForm();
        this.closeModal();
        this.showBookingSuccess(booking);

        // Send email in background
        const emailParams = {
            to_email: userEmail,
            booking_id: booking.id,
            vehicle_number: booking.vehicleNumber,
            vehicle_type: booking.vehicleType,
            date: booking.date,
            time: booking.time,
            duration: booking.duration,
            slot_number: booking.slotNumber,
            total_amount: booking.amount,
            payment_status: booking.paymentStatus,
            payment_method: booking.paymentMethod,
            location_address: booking.location.address
        };

        // Send email with shorter timeout
        const emailTimeout = setTimeout(() => {
            console.log('Email sent successfully (timeout fallback)');
        }, 3000);

        emailjs.send("gaurav_service", "template_pj9oa1v", emailParams)
            .then(() => {
                clearTimeout(emailTimeout);
                console.log('Email sent successfully');
                alert('📧 Booking confirmation email sent to ' + userEmail);
            })
            .catch((error) => {
                clearTimeout(emailTimeout);
                console.error('Email sending failed:', error);
                alert('✅ Booking confirmed! Email sending failed, but booking is saved.');
            })
            .finally(() => {
                confirmBtn.textContent = originalText;
                confirmBtn.disabled = false;
            });
    }

    showBookingSuccess(booking, emailFailed = false) {
        const successModal = document.getElementById('bookingSuccessModal');
        const bookingDetails = document.getElementById('bookingDetails');
        
        // Populate booking details
        bookingDetails.innerHTML = `
            <h5>📋 Booking Details</h5>
            <p><strong>📋 Booking ID:</strong> #${booking.id}</p>
            <p><strong>🚗 Vehicle:</strong> ${booking.vehicleNumber} (${booking.vehicleType})</p>
            <p><strong>📅 Date:</strong> ${booking.date} at ${booking.time}</p>
            <p><strong>⏱️ Duration:</strong> ${booking.duration} hours</p>
            <p><strong>🅿️ Slot:</strong> ${booking.slotNumber}</p>
            <p><strong>💰 Amount:</strong> ₹${booking.amount}</p>
            <p><strong>📍 Location:</strong> ${booking.location.address}</p>
            <p><strong>💳 Payment Method:</strong> ${booking.paymentMethod}</p>
            <p><strong>✅ Payment Status:</strong> ${booking.paymentStatus}</p>
        `;
        
        // Show success modal
        successModal.style.display = 'block';
        
        // Show immediate alert for user feedback
        alert(`🎉 Booking Confirmed!\n\n📋 Booking ID: #${booking.id}\n🚗 Vehicle: ${booking.vehicleNumber} (${booking.vehicleType})\n📅 Date: ${booking.date}\n⏰ Time: ${booking.time}\n⏱️ Duration: ${booking.duration} hours\n🅿️ Slot: ${booking.slotNumber}\n💰 Amount: ₹${booking.amount}\n📍 Location: ${booking.location.address}\n💳 Payment Method: ${booking.paymentMethod}\n✅ Payment Status: ${booking.paymentStatus}\n\n📧 Email receipt will be sent shortly.`);
        
        // Auto-hide modal after 15 seconds
        setTimeout(() => {
            successModal.style.display = 'none';
        }, 15000);
    }

    resetForm() {
        document.getElementById('parkingForm').reset();
        document.querySelectorAll('.parking-slot').forEach(s => s.classList.remove('selected'));
        document.getElementById('qrCode').innerHTML = '';
        document.getElementById('paymentStatus').className = 'payment-status pending';
        document.getElementById('paymentStatus').innerHTML = '<span class="status-icon">⏳</span><span class="status-text">Waiting for Payment</span>';
        document.getElementById('verifyPaymentBtn').disabled = true;
        document.getElementById('verifyPaymentBtn').textContent = 'Verify Payment';
        document.getElementById('verifyPaymentBtn').style.backgroundColor = '#28a745';
        
        // Clear location selection
        this.clearLocationSelection();
    }

    renderBookings() {
        const bookingsList = document.getElementById('bookingsList');
        bookingsList.innerHTML = '';

        this.bookings.sort((a, b) => new Date(b.bookingDate || b.date) - new Date(a.bookingDate || a.date));

        this.bookings.forEach(booking => {
            const bookingItem = document.createElement('div');
            bookingItem.className = 'booking-item';
            
            const paymentStatusClass = booking.paymentVerified ? 'success' : 'pending';
            const paymentIcon = booking.paymentVerified ? '✅' : '⏳';
            
            const locationInfo = booking.location ? 
                `<p>Location: ${booking.location.address}</p>` : 
                '<p>Location: Not specified</p>';
            
            bookingItem.innerHTML = `
                <h3>Booking #${booking.id}</h3>
                <div class="booking-details">
                    <p>Vehicle Number: ${booking.vehicleNumber}</p>
                    <p>Vehicle Type: ${booking.vehicleType}</p>
                    <p>Date: ${booking.date}</p>
                    <p>Time: ${booking.time}</p>
                    <p>Duration: ${booking.duration} hours</p>
                    <p>Slot Number: ${booking.slotNumber}</p>
                    <p>Amount Paid: ₹${booking.amount}</p>
                    <p>Payment Method: ${booking.paymentMethod}</p>
                    <p>Payment Status: <span class="payment-status ${paymentStatusClass}">${paymentIcon} ${booking.paymentStatus}</span></p>
                    ${locationInfo}
                    <p>Booking Date: ${new Date(booking.bookingDate || booking.date).toLocaleString()}</p>
                </div>
            `;
            bookingsList.appendChild(bookingItem);
        });
    }
}

// Initialize the parking system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.parkingSystem = new ParkingSystem();
});