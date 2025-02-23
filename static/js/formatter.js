// Import statements removed for simplicity (assumed TipTap is loaded via CDN)

document.addEventListener('DOMContentLoaded', function() {
    // Access TipTap through the correct global namespace
    const { Editor } = window.tiptap;
    const { default: StarterKit } = window.tiptapStarterKit;

    // Initialize a simple TipTap editor using only the StarterKit
    const editor = new Editor({
        element: document.querySelector('#editor'),
        extensions: [
            StarterKit
        ],
        content: '<p>Start typing here...</p>',
        editable: true,
        autofocus: true,
        editorProps: {
            attributes: {
                class: 'form-control editor-content',
                'data-placeholder': 'Type or paste your text here...'
            }
        }
    });
});