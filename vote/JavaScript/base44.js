
        // Image Viewer Logic
        function viewImage(src) {
            const viewer = document.getElementById('imageViewer');
            const img = document.getElementById('imageViewerImg');
            img.src = src;
            viewer.classList.add('active');
        }

        function closeImageViewer() {
            document.getElementById('imageViewer').classList.remove('active');
        }
    