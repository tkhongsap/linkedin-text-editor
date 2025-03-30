document.addEventListener('DOMContentLoaded', function() {
    // Access TipTap through the correct global namespace
    const { Editor } = window.tiptap;
    const { default: StarterKit } = window.tiptapStarterKit;
    const { default: Underline } = window.tiptapExtensionUnderline;

    // Initialize TipTap editor with all required extensions
    const editor = new Editor({
        element: document.querySelector('#editor'),
        extensions: [
            StarterKit,
            Underline
        ],
        content: '<p>Write here...</p>',
        editable: true,
        autofocus: true,
        editorProps: {
            attributes: {
                class: 'form-control editor-content',
                'data-placeholder': 'Write here...'
            }
        }
    });

    // Connect formatting buttons to editor commands
    document.getElementById('bold-btn').addEventListener('click', () => {
        editor.chain().focus().toggleBold().run();
        updatePreview(editor.getHTML());
    });

    document.getElementById('italic-btn').addEventListener('click', () => {
        editor.chain().focus().toggleItalic().run();
        updatePreview(editor.getHTML());
    });

    document.getElementById('underline-btn').addEventListener('click', () => {
        editor.chain().focus().toggleUnderline().run();
        updatePreview(editor.getHTML());
    });

    document.getElementById('strikethrough-btn').addEventListener('click', () => {
        editor.chain().focus().toggleStrike().run();
        updatePreview(editor.getHTML());
    });

    document.getElementById('code-btn').addEventListener('click', () => {
        editor.chain().focus().toggleCode().run();
        updatePreview(editor.getHTML());
    });

    document.getElementById('link-btn').addEventListener('click', () => {
        const url = prompt('Enter URL');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
        updatePreview(editor.getHTML());
    });

    document.getElementById('bullet-list-btn').addEventListener('click', () => {
        editor.chain().focus().toggleBulletList().run();
        updatePreview(editor.getHTML());
    });

    document.getElementById('ordered-list-btn').addEventListener('click', () => {
        editor.chain().focus().toggleOrderedList().run();
        updatePreview(editor.getHTML());
    });

    document.getElementById('undo-btn').addEventListener('click', () => {
        editor.chain().undo().run();
        updatePreview(editor.getHTML());
    });

    document.getElementById('redo-btn').addEventListener('click', () => {
        editor.chain().redo().run();
        updatePreview(editor.getHTML());
    });

    document.getElementById('clear-formatting-btn').addEventListener('click', () => {
        editor.chain().focus().clearNodes().unsetAllMarks().run();
        updatePreview(editor.getHTML());
    });

    // Handle content changes to update preview
    editor.on('update', () => {
        updatePreview(editor.getHTML());
    });

    // Toggle preview visibility
    document.getElementById('preview-toggle').addEventListener('click', function() {
        const previewContainer = document.getElementById('preview-container');
        const editorContainer = document.querySelector('.editor-container');
        
        if (previewContainer.style.display === 'none') {
            previewContainer.style.display = 'block';
            editorContainer.style.display = 'none';
            this.textContent = 'Back to Editor';
            updatePreview(editor.getHTML());
        } else {
            previewContainer.style.display = 'none';
            editorContainer.style.display = 'block';
            this.textContent = 'Post Preview';
        }
    });

    // Copy text button
    document.getElementById('copy-btn').addEventListener('click', function() {
        const formattedText = document.getElementById('preview-content').textContent;
        navigator.clipboard.writeText(formattedText)
            .then(() => {
                this.innerHTML = '<i class="bi bi-check2"></i> Copied!';
                this.classList.add('btn-success');
                
                setTimeout(() => {
                    this.innerHTML = '<i class="bi bi-clipboard"></i> Copy text';
                    this.classList.remove('btn-success');
                }, 2000);
            })
            .catch(err => {
                console.error('Error copying text: ', err);
                alert('Failed to copy text: ' + err);
            });
    });

    // Placeholder functionality for scheduling button
    document.getElementById('schedule-btn').addEventListener('click', function() {
        alert('Scheduling feature coming soon!');
    });

    // Placeholder functionality for post now button
    document.getElementById('post-now-btn').addEventListener('click', function() {
        alert('This is a demo. In a real application, this would post to LinkedIn.');
    });

    // Function to update the preview with formatted content
    function updatePreview(html) {
        const previewContent = document.getElementById('preview-content');
        
        // Process the HTML content to apply LinkedIn styling
        let processedHTML = html;
        
        // Replace hashtags with styled versions
        processedHTML = processedHTML.replace(/#(\w+)/g, '<span class="text-primary">#$1</span>');
        
        // Format content for LinkedIn preview
        previewContent.innerHTML = processedHTML;
        
        // Format the text using the backend API if needed
        formatText(previewContent.textContent);
    }

    // Function to send text to backend for formatting
    function formatText(text) {
        if (!text || text.trim() === '') return;
        
        fetch('/api/format', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error formatting text:', data.error);
                return;
            }
            
            // Use the formatted text if needed
            console.log('Formatted text:', data.formatted_text);
            // You could update the preview with this text if needed
        })
        .catch(error => {
            console.error('Error calling format API:', error);
        });
    }
});