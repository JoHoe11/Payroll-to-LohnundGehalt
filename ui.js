//file input display
document.addEventListener('DOMContentLoaded', function() {
    // Handle file input changes
    document.getElementById('lohnjournalFile').addEventListener('change', function() {
        updateFileLabel(this, 'lohnjournalFileName');
    });
    
    document.getElementById('personalkostenFile').addEventListener('change', function() {
        updateFileLabel(this, 'personalkostenFileName');
    });
    
    // Helper function to update file labels
    function updateFileLabel(input, labelId) {
        const label = document.getElementById(labelId);
        if (input.files && input.files.length > 0) {
            label.textContent = input.files[0].name;
            label.style.color = 'var(--color-white)';
        } else {
            label.textContent = 'Keine Datei ausgewählt';
            label.style.color = 'var(--color-light-gray)';
        }
    }
    
    // Add validation for bAV and NBA special code fields
    const bAVInput = document.getElementById('bAVspecialcode');
    const NBAInput = document.getElementById('NBAspecialcode');
    
    // Create validation functions for these fields
    function validateSpecialCode(input, fieldName) {
        const value = input.value.trim();
        // Regex to check for comma-separated numbers with no spaces
        const isValid = /^(\d+)(,\d+)*$/.test(value) || value === '';
        
        // Create or get the error message element
        let errorMsgId = `${fieldName}Error`;
        let errorMsg = document.getElementById(errorMsgId);
        
        if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.id = errorMsgId;
            errorMsg.className = 'error-message';
            errorMsg.style.color = 'var(--color-red)';
            errorMsg.style.fontSize = '12px';
            errorMsg.style.marginTop = '5px';
            input.parentNode.appendChild(errorMsg);
        }
        
        if (!isValid && value !== '') {
            errorMsg.textContent = `Ungültiges Format. Nur Zahlen mit Kommas ohne Leerzeichen (z.B. 101,102,103)`;
            errorMsg.style.display = 'block';
            input.style.borderColor = 'var(--color-red)';
            return false;
        } else {
            errorMsg.style.display = 'none';
            input.style.borderColor = '';
            return true;
        }
    }
    
    // Add validation event listeners
    bAVInput.addEventListener('input', function() {
        validateSpecialCode(this, 'bAV');
    });
    
    bAVInput.addEventListener('blur', function() {
        validateSpecialCode(this, 'bAV');
    });
    
    NBAInput.addEventListener('input', function() {
        validateSpecialCode(this, 'NBA');
    });
    
    NBAInput.addEventListener('blur', function() {
        validateSpecialCode(this, 'NBA');
    });
});

//filename being properly used
(function() {
    // Only run this after the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Get the original click handler
        const startButton = document.getElementById('startButton');
        const originalClickHandler = startButton.onclick;
        
        // Remove the original handler
        startButton.onclick = null;
        
        // Add enhanced handler
        startButton.addEventListener('click', async function(e) {
            // Prevent any default action
            e.preventDefault();
            
            // Validate the special code fields
            const bAVInput = document.getElementById('bAVspecialcode');
            const NBAInput = document.getElementById('NBAspecialcode');
            const bAVValid = /^(\d+)(,\d+)*$/.test(bAVInput.value.trim()) || bAVInput.value.trim() === '';
            const NBAValid = /^(\d+)(,\d+)*$/.test(NBAInput.value.trim()) || NBAInput.value.trim() === '';
            
            // Show error messages if needed
            if (!bAVValid) {
                const errorMsg = document.getElementById('bAVError') || document.createElement('div');
                errorMsg.id = 'bAVError';
                errorMsg.textContent = `Ungültiges Format. Nur Zahlen mit Kommas ohne Leerzeichen (z.B. 101,102,103)`;
                errorMsg.style.color = 'var(--color-red)';
                errorMsg.style.fontSize = '12px';
                errorMsg.style.marginTop = '5px';
                errorMsg.style.display = 'block';
                bAVInput.style.borderColor = 'var(--color-red)';
                bAVInput.parentNode.appendChild(errorMsg);
            }
            
            if (!NBAValid) {
                const errorMsg = document.getElementById('NBAError') || document.createElement('div');
                errorMsg.id = 'NBAError';
                errorMsg.textContent = `Ungültiges Format. Nur Zahlen mit Kommas ohne Leerzeichen (z.B. 9001,9002,9003)`;
                errorMsg.style.color = 'var(--color-red)';
                errorMsg.style.fontSize = '12px';
                errorMsg.style.marginTop = '5px';
                errorMsg.style.display = 'block';
                NBAInput.style.borderColor = 'var(--color-red)';
                NBAInput.parentNode.appendChild(errorMsg);
            }
            
            // Stop if validation fails
            if (!bAVValid || !NBAValid) {
                alert('Bitte korrigieren Sie die Formatfehler in den Eingabefeldern.');
                return;
            }
            
            // Get and validate the filename
            const outputFilename = document.getElementById('outputFilename').value.trim();
            
            // Make sure there's a filename
            if (!outputFilename) {
                alert('Bitte geben Sie einen Dateinamen ein.');
                return;
            }
            
            // Log for debugging
            console.log('Using filename:', outputFilename);
            
            // Create a clean version of the filename (just in case)
            const cleanFilename = outputFilename.includes('.xlsx') ? 
                outputFilename : 
                outputFilename + '.xlsx';
                
            // Set the clean filename back to the input
            document.getElementById('outputFilename').value = cleanFilename;
            
            // Proceed with original click handler if it exists
            if (typeof originalClickHandler === 'function') {
                originalClickHandler.call(this, e);
            }
        });
        
        //Download link to use the correct filename
        document.addEventListener('click', function(e) {
            // Check if this is the download link
            if (e.target.id === 'downloadLink' || e.target.closest('#downloadLink')) {
                // Get the filename from the input field
                const filename = document.getElementById('outputFilename').value.trim() || 'G2N_output.xlsx';
                
                // Set the download attribute to the filename
                document.getElementById('downloadLink').download = filename;
                
                // Log for debugging
                console.log('Download using filename:', filename);
            }
        }, true);
    });
})();

// Ensure filename always contains G2N
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        const outputFilenameInput = document.getElementById('outputFilename');
        
        // Initial validation message
        const validationMsg = document.createElement('div');
        validationMsg.id = 'filenameValidation';
        validationMsg.style.fontSize = '12px';
        validationMsg.style.marginTop = '5px';
        validationMsg.style.color = 'var(--color-red)';
        validationMsg.style.display = 'none';
        validationMsg.textContent = 'Der Dateiname muss "G2N" enthalten.';
        outputFilenameInput.parentNode.appendChild(validationMsg);
        
        // Validate on input change
        outputFilenameInput.addEventListener('input', validateFilename);
        outputFilenameInput.addEventListener('blur', validateFilename);
        
        function validateFilename() {
            const filename = outputFilenameInput.value.trim();
            const validationElement = document.getElementById('filenameValidation');
            
            if (filename && !filename.includes('G2N')) {
                validationElement.style.display = 'block';
                outputFilenameInput.style.borderColor = 'var(--color-red)';
            } else {
                validationElement.style.display = 'none';
                outputFilenameInput.style.borderColor = '';
            }
        }
        
        // Override the start button click to ensure G2N is in filename
        const startButton = document.getElementById('startButton');
        const originalStartClick = startButton.onclick;
        
        startButton.onclick = null;
        startButton.addEventListener('click', function(e) {
            let filename = outputFilenameInput.value.trim();
            
            // If empty, set a default with G2N
            if (!filename) {
                filename = 'G2N_output.xlsx';
                outputFilenameInput.value = filename;
            }
            // If missing G2N, add it
            else if (!filename.includes('G2N')) {
                // Add G2N before the extension or at the end
                if (filename.includes('.xlsx')) {
                    filename = filename.replace('.xlsx', '_G2N.xlsx');
                } else {
                    filename = filename + '_G2N.xlsx';
                }
                outputFilenameInput.value = filename;
                alert('G2N wurde automatisch zum Dateinamen hinzugefügt: ' + filename);
            }
            
            // Ensure xlsx extension
            if (!filename.toLowerCase().endsWith('.xlsx')) {
                filename += '.xlsx';
                outputFilenameInput.value = filename;
            }
            
            // Continue with original click handler if it exists
            if (typeof originalStartClick === 'function') {
                originalStartClick.call(this, e);
            }
        });
        
        // Also update the download link to use the correct filename
        const downloadLink = document.getElementById('downloadLink');
        if (downloadLink) {
            downloadLink.addEventListener('click', function() {
                let filename = outputFilenameInput.value.trim();
                
                // Use a default if empty
                if (!filename) {
                    filename = 'G2N_2025.xlsx';
                }
                
                // Ensure G2N is included
                if (!filename.includes('G2N')) {
                    if (filename.includes('.xlsx')) {
                        filename = filename.replace('.xlsx', '_G2N.xlsx');
                    } else {
                        filename = filename + '_G2N.xlsx';
                    }
                }
                
                // Ensure xlsx extension
                if (!filename.toLowerCase().endsWith('.xlsx')) {
                    filename += '.xlsx';
                }
                
                // Set the filename for download
                this.download = filename;
                console.log('Download filename set to:', filename);
            });
        }
    });
})();