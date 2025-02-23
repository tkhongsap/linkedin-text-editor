document.addEventListener('DOMContentLoaded', function() {
    const inputText = document.getElementById('inputText');
    const previewArea = document.getElementById('previewArea');
    const copyButton = document.getElementById('copyButton');
    const errorMessage = document.getElementById('errorMessage');
    let formatTimeout;

    // Format text when input changes
    inputText.addEventListener('input', function() {
        clearTimeout(formatTimeout);
        formatTimeout = setTimeout(formatText, 300);
    });

    // Copy button functionality
    copyButton.addEventListener('click', async function() {
        try {
            await navigator.clipboard.writeText(previewArea.textContent);
            copyButton.classList.add('copy-success');
            copyButton.innerHTML = '<i class="bi bi-check"></i> Copied!';
            setTimeout(() => {
                copyButton.classList.remove('copy-success');
                copyButton.innerHTML = '<i class="bi bi-clipboard"></i> Copy';
            }, 2000);
        } catch (err) {
            showError('Failed to copy text. Please try selecting and copying manually.');
        }
    });

    function formatText() {
        const text = inputText.value.trim();
        
        if (!text) {
            previewArea.textContent = 'Your formatted text will appear here...';
            copyButton.disabled = true;
            hideError();
            return;
        }

        fetch('/format', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showError(data.error);
                previewArea.textContent = 'Please fix the formatting errors...';
                copyButton.disabled = true;
            } else {
                hideError();
                previewArea.textContent = data.text;
                copyButton.disabled = false;
            }
        })
        .catch(error => {
            showError('An error occurred while formatting the text.');
            console.error('Error:', error);
        });
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
    }

    function hideError() {
        errorMessage.classList.add('d-none');
        errorMessage.textContent = '';
    }
});
