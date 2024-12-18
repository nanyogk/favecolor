const mainColorPicker = document.getElementById('mainColor');
const subColorPicker = document.getElementById('subColor');
const textColorPicker = document.getElementById('textColor');
const messageInput1 = document.getElementById('message1');
const messageInput2 = document.getElementById('message2');
const messageInput3 = document.getElementById('message3');
const refreshRateSlider = document.getElementById('refreshRate');
const subColorHeightSlider = document.getElementById('subColorHeight');
const goFullscreenButton = document.getElementById('goFullscreen');
const qrcodeDiv = document.getElementById('qrcode');
const fullscreenPage = document.getElementById('fullscreenPage');
const fullscreenText = document.getElementById('fullscreenText');
const topBar = document.getElementById('topBar');
const bottomBar = document.getElementById('bottomBar');
const originalTitle = document.querySelector('title').textContent;
const pastMessagesContainer = document.getElementById('pastMessages');
const messageList = document.getElementById('messageList');
const maxPastMessages = 30;

let tapCount = 0;
let tapTimeout;
let currentMessageIndex = 0;
let refreshInterval;
let originalOrientation; // Store the original orientation
let messages = []; //Dynamic from user input and also from pastMsg clicks.

function generateQRCode(url) {
    const qrcodeContainer = document.getElementById("qrcode");
    qrcodeContainer.innerHTML = ''; // Clear the container 
    if (url.length <= 2000) {
        //new QRCode(qrcodeContainer, url);
        new QRCode(qrcodeContainer, url);
        // ... rest of your QR code display logic ... 
    } else {
        // Disable QR code display or show an error message
        qrcodeContainer.innerHTML = '<p>Error: URL too long for QR code.</p>';
    }
    const urlText = document.getElementById('urlText');
    urlText.value = url; // Update Text.
    const shareButton = document.getElementById('shareButton');
    shareButton.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: document.title,
                url: urlText.value
            })
                .then(() => console.log('Successful share'))
                .catch((error) => console.log('Error sharing', error));
        } else {
            // (e.g., copy to clipboard)
            //urlText.select();
            //document.execCommand('copy');
            //alert('URL copied to clipboard!');
        }
    });
    // Show this container segement.
    document.querySelector('.url-share-container').style.display = 'block';
}

function updateFullscreenPage() {
    const mainColor = mainColorPicker.value;
    const subColor = subColorPicker.value;
    const textColor = textColorPicker.value;
    const subColorHeight = subColorHeightSlider.value;

    fullscreenPage.style.backgroundColor = mainColor;
    fullscreenText.style.color = textColor;
    fullscreenText.textContent = messages[currentMessageIndex];
    topBar.style.backgroundColor = subColor;
    bottomBar.style.backgroundColor = subColor;
    topBar.style.height = subColorHeight + "%";
    bottomBar.style.height = subColorHeight + "%";

    // Message array logic
    messages.length = 0; // Clear the array
    if (messageInput1.value.trim() !== "") {
        messages.push(messageInput1.value);
    }
    if (messageInput2.value.trim() !== "") {
        messages.push(messageInput2.value);
    }
    if (messageInput3.value.trim() !== "") {
        messages.push(messageInput3.value);
    }

    // Text on/off logic
    if (messages.length > 0) {
        fullscreenText.style.display = 'block';
        fullscreenText.textContent = messages[currentMessageIndex];
        currentMessageIndex = (currentMessageIndex + 1) % messages.length;
        // Dynamic font sizing 
        const maxWidth = fullscreenPage.offsetWidth;
        const messageLength = fullscreenText.textContent.length;
        let fontSize = 100; // Starting font size
        fullscreenText.style.fontSize = fontSize + "em";

        // Adjust character width based on language
        let charWidth = 12;
        if (isDoubleByte(fullscreenText.textContent)) {
            charWidth = 18; // Wider estimate for Japanese characters
        }

        // Calculate approximate text width with a safety margin
        let textWidth = messageLength * fontSize * charWidth;

        // Reduce font size until it fits with a margin
        while (textWidth > maxWidth * 0.95) {
            fontSize--;
            fullscreenText.style.fontSize = fontSize + "em";
            textWidth = messageLength * fontSize * charWidth;
        }
    } else {
        fullscreenText.style.display = 'none';
    }
}

goFullscreenButton.addEventListener('click', () => {
    storeMessage(); //remembeer.
    originalOrientation = screen.orientation.type; // Store Original;
    prepPage.style.display = 'none';
    fullscreenPage.style.display = 'flex';
    updatePageTitle();
    updateFullscreenPage(); // Initial update

    const url = new URL(window.location.href);
    url.searchParams.set('c1', mainColorPicker.value);
    url.searchParams.set('c2', subColorPicker.value);
    url.searchParams.set('ct', textColorPicker.value);
    url.searchParams.set('m1', messageInput1.value);
    url.searchParams.set('m2', messageInput2.value);
    url.searchParams.set('m3', messageInput3.value);
    url.searchParams.set('rate', refreshRateSlider.value);
    url.searchParams.set('hei', subColorHeightSlider.value);
    console.log("defined url:" + url.href);

    const refreshRate = parseInt(refreshRateSlider.value, 10) * 1000; // Get refresh rate in milliseconds
    // Calculate the initial delay to sync with the clock
    const now = new Date();
    const initialDelay = refreshRate - (now % refreshRate);

    // Update the URL in the address bar
    window.history.pushState({}, '', url);
    generateQRCode(url.href);

    clearInterval(refreshInterval); // Clear any existing interval 
    // Set up the interval to sync with the clock (with initial delay)
    refreshInterval = setInterval(() => {
        updateFullscreenPage();
    }, refreshRate, initialDelay); // Add initialDelay as the third argument

    const fullscreenElement = document.documentElement; // Or the element you want to make fullscreen
    if (fullscreenElement.requestFullscreen) {
        fullscreenElement.requestFullscreen();
    } else if (fullscreenElement.webkitRequestFullscreen) { /* Safari */
        fullscreenElement.webkitRequestFullscreen();
    } else if (fullscreenElement.msRequestFullscreen) { /* IE11 */
        fullscreenElement.msRequestFullscreen();
    }

    // Lock orientation to landscape
    screen.orientation.lock("landscape").catch(function (error) {
        console.error("Orientation lock failed, Not supported on this device?: ", error);
        // Display a message suggesting manual rotation->This is annoying
        //alert("Please rotate your device to landscape for fullscreen mode. スマホの回転ロックを解除、または横画面にして再度試してください");
    });
});

// Load parameters from URL on page load
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('c1')) {
    mainColorPicker.value = urlParams.get('c1');
    subColorPicker.value = urlParams.get('c2');
    textColorPicker.value = urlParams.get('ct');
    messageInput1.value = urlParams.get('m1');
    messageInput2.value = urlParams.get('m2');
    messageInput3.value = urlParams.get('m3');
    refreshRateSlider.value = urlParams.get('rate');
    subColorHeightSlider.value = urlParams.get('hei');
    // Automatically transition to fullscreenPage
    //goFullscreenButton.click(); // Simulate button click to trigger fullscreen
}


refreshRateSlider.addEventListener('input', () => {
    refreshRateValue.textContent = refreshRateSlider.value;
});

subColorHeightSlider.addEventListener('input', () => {
    subColorHeightValue.textContent = subColorHeightSlider.value;
});

// Function to clear the interval when returning to config
function clearRefreshInterval() {
    clearInterval(refreshInterval);
}

fullscreenPage.addEventListener('dblclick', () => {
    clearTimeout(tapTimeout);
    tapCount = 0; // clear dblclick.

    // Exit fullscreen
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
    }
    // Show the prepPage and hide the fullscreenPage
    prepPage.style.display = 'flex';
    fullscreenPage.style.display = 'none';
    clearRefreshInterval();
    screen.orientation.unlock();
    screen.orientation.lock(originalOrientation).catch(error => {
        console.error("Orientation restore failed:", error);
    });
});

fullscreenPage.addEventListener('click', () => {
    //Double Tap to exist FullScreen.
    tapCount++;
    if (tapCount === 1) {
        tapTimeout = setTimeout(() => {
            tapCount = 0;
        }, 300); // Reset tap count after 300ms (adjust as needed)
    }
});

function updatePageTitle() {
    // Update page title
    let newTitle = "";
    if (messageInput1.value.trim() !== "") {
        newTitle += messageInput1.value;
    }
    if (messageInput2.value.trim() !== "") {
        newTitle += " / " + messageInput2.value;
    }
    if (messageInput3.value.trim() !== "") {
        newTitle += " / " + messageInput3.value;
    }
    if (newTitle !== "") {
        newTitle += " - ";
    }

    // Dynamically retrieve original title
    newTitle += originalTitle;
    document.title = newTitle;
}

function updatePastMessagesDisplay() {
    const messageGrid = document.getElementById('messageGrid');
    messageGrid.innerHTML = ''; // Clear the grid

    const pastMessages = JSON.parse(localStorage.getItem('pastMessages')) || [];

    pastMessages.forEach((messageData, index) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message-item');

        // Set background color and text color
        messageDiv.style.backgroundColor = messageData.mainColor;
        messageDiv.style.color = messageData.textColor;

        // Split messages and add sub color to "/"
        const messageParts = messageData.messages.split(' / ');
        const formattedMessages = messageParts.map((msg, i) => {
            if (msg.trim() === "") {
                const placeholderSpan = document.createElement('span');
                placeholderSpan.textContent = '...';
                placeholderSpan.style.backgroundColor = messageData.mainColor;
                return placeholderSpan;
            } else {
                const msgSpan = document.createElement('span');
                msgSpan.textContent = msg.length > 5 ? msg.slice(0, 5) + '...' : msg;
                if (i < messageParts.length - 1) {
                    const slashSpan = document.createElement('span');
                    slashSpan.textContent = ' / ';
                    slashSpan.style.backgroundColor = messageData.subColor;
                    const containerSpan = document.createElement('span');
                    containerSpan.appendChild(msgSpan);
                    containerSpan.appendChild(slashSpan);
                    return containerSpan;
                } else {
                    return msgSpan;
                }
            }
        }).flat();

        formattedMessages.forEach(element => messageDiv.appendChild(element));

        // Add delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', (event) => {
            event.stopPropagation();
            pastMessages.splice(index, 1);
            localStorage.setItem('pastMessages', JSON.stringify(pastMessages));
            updatePastMessagesDisplay();
        });
        messageDiv.appendChild(deleteButton);

        // Add click listener to switch to past message
        messageDiv.addEventListener('click', () => {
            mainColorPicker.value = messageData.mainColor;
            subColorPicker.value = messageData.subColor;
            textColorPicker.value = messageData.textColor;
            messages = messageData.messages.split(' / ');

            // Update UI with past message
            updateInputsWithMessage(messageData);
            updateFullscreenPage();
        });

        messageGrid.appendChild(messageDiv);
    });
}

function storeMessage() {
    const messageData = {
        mainColor: mainColorPicker.value,
        subColor: subColorPicker.value,
        textColor: textColorPicker.value,
        messages: [
            messageInput1.value,
            messageInput2.value,
            messageInput3.value
        ].join(' / ')
    };
    let pastMessages = JSON.parse(localStorage.getItem('pastMessages')) || [];

    // Unique check
    const isDuplicate = pastMessages.some(pastMessage => {
        return (
            pastMessage.mainColor === messageData.mainColor &&
            pastMessage.subColor === messageData.subColor &&
            pastMessage.textColor === messageData.textColor &&
            pastMessage.messages === messageData.messages
        );
    });

    if (!isDuplicate) { // Only add if not a duplicate
        pastMessages.unshift(messageData);
        pastMessages = pastMessages.slice(0, maxPastMessages);
        localStorage.setItem('pastMessages', JSON.stringify(pastMessages));

        updatePastMessagesDisplay();
    }
}

function updateInputsWithMessage(messageData) {
    const messageParts = messageData.messages.split(' / ');
    messageInput1.value = messageParts[0] || '';
    messageInput2.value = messageParts[1] || '';
    messageInput3.value = messageParts[2] || '';
    mainColorPicker.value = messageData.mainColor;
    subColorPicker.value = messageData.subColor;
    textColorPicker.value = messageData.textColor;
}

function isDoubleByte(text) {
    // Used in Dynamic Font Sizing.
    return /[\u2E80-\u2EFF]|[\u2F00-\u2FDF]|[\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\u3100-\u312F]|[\u3130-\u318F]|[\u3190-\u319F]|[\u31A0-\u31BF]|[\u31F0-\u31FF]|[\u3200-\u32FF]|[\u3300-\u33FF]|[\u3400-\u4DBF]|[\u4DC0-\u4DFF]|[\u4E00-\u9FFF]|[\uA000-\uA48F]|[\uA490-\uA4CF]|[\uAC00-\uD7AF]|[\uD7B0-\uD7FF]|[\uF900-\uFAFF]|[\uFE30-\uFE4F]|[\uFF00-\uFFEF]/g.test(text);
}
// Call updatePastMessagesDisplay() on page load
updatePastMessagesDisplay();