document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('startButton');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const statusLabel = document.getElementById('statusLabel');
    const resultContainer = document.getElementById('resultContainer');
    const resultMessage = document.getElementById('resultMessage');
    const downloadLink = document.getElementById('downloadLink');
    
    // Validate filename contains G2N
    const outputFilename = document.getElementById('outputFilename');
    outputFilename.addEventListener('change', function() {
        if (!this.value.includes('G2N')) {
            alert('Der Dateiname sollte die Kennung G2N enthalten.');
        }
    });

    // UI-User Input
    startButton.addEventListener('click', async function() {
        // Get form values
        const bAVspecialcode = document.getElementById('bAVspecialcode').value;
        const NBAspecialcode = document.getElementById('NBAspecialcode').value;
        const outputFilename = document.getElementById('outputFilename').value;
        
        // Get files
        const lohnjournalFile = document.getElementById('lohnjournalFile').files[0];
        const personalkostenFile = document.getElementById('personalkostenFile').files[0];
        
        // Validate inputs
        if (!lohnjournalFile || !personalkostenFile) {
            alert('Bitte wählen Sie alle erforderlichen Dateien aus.');
            return;
        }
        
        // Show progress
        startButton.disabled = true;
        progressContainer.classList.remove('hidden');
        
        try {
            // 1. Process TXT files
            statusLabel.textContent = 'TXT-Dateien werden geladen...';
            progressBar.style.width = '20%';
            
            // Read raw TXT text content with proper encoding detection
            const lohnjournalText = await readFileAsText(lohnjournalFile);
            const personalkostenText = await readFileAsText(personalkostenFile);
            
            // Parse TXT files
            statusLabel.textContent = 'Daten werden analysiert...';
            progressBar.style.width = '40%';
            const lohnjournalData = parseTxtFile(lohnjournalText, 'LA');
            const personalkostenData = parseTxtFile(personalkostenText, 'SD');
            
            // 2. Process LA data for the additional tables
            statusLabel.textContent = 'Lohnartenwerte und NBA-Daten werden extrahiert...';
            progressBar.style.width = '60%';
            const processedLAData = processLAData(lohnjournalData);
            
            // 3. Filter out special codes
            statusLabel.textContent = 'Spezialcodes werden gefiltert...';
            
            // Filter bAV special codes from Lohnartenwerte
            let filteredLawData = [...processedLAData.lawData]; // Create a copy
            if (bAVspecialcode && bAVspecialcode.trim() !== '') {
                const bAVCodes = bAVspecialcode.split(',').map(code => code.trim()).filter(code => code !== '');
                if (bAVCodes.length > 0) {
                    const originalCount = filteredLawData.length;
                    filteredLawData = filteredLawData.filter(row => !bAVCodes.includes(String(row["Lohnart"])));
                    console.log(`Filtered out ${originalCount - filteredLawData.length} rows from Lohnartenwerte with bAV codes: ${bAVCodes.join(', ')}`);
                }
            }
            
            // Filter NBA special codes from NBA Daten
            let filteredNbaData = [...processedLAData.nbaData]; // Create a copy
            if (NBAspecialcode && NBAspecialcode.trim() !== '') {
                const NBACodes = NBAspecialcode.split(',').map(code => code.trim()).filter(code => code !== '');
                if (NBACodes.length > 0) {
                    const originalCount = filteredNbaData.length;
                    filteredNbaData = filteredNbaData.filter(row => !NBACodes.includes(String(row["Netto-Bezüge/ -Abzüge Nummer"])));
                    console.log(`Filtered out ${originalCount - filteredNbaData.length} rows from NBA Daten with NBA codes: ${NBACodes.join(', ')}`);
                }
            }
            
            // 4. Merge data for main table
            statusLabel.textContent = 'Daten werden zusammengeführt...';
            progressBar.style.width = '80%';
            const mergedData = mergeData(lohnjournalData, personalkostenData);
            
            // 5. Create Excel file
            statusLabel.textContent = 'Excel-Datei wird erstellt...';
            progressBar.style.width = '90%';
            const excelBlob = createExcelFile(
                {
                    merged_df_all: mergedData,
                    combined_law_df: filteredLawData, // Use filtered data here
                    combined_nba_df: filteredNbaData   // Use filtered data here
                }, 
                outputFilename, 
                bAVspecialcode, 
                NBAspecialcode
            );
            
            // 6. Generate download link directly
            progressBar.style.width = '100%';
            statusLabel.textContent = 'Verarbeitung wurde erfolgreich abgeschlossen.';
            resultMessage.textContent = 'Daten wurden erfolgreich verarbeitet. Klicken Sie auf den Link, um die Excel-Datei herunterzuladen.';
            
            // Create URL for download
            const url = URL.createObjectURL(excelBlob);
            downloadLink.href = url;
            downloadLink.download = outputFilename;
            resultContainer.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error:', error);
            progressBar.style.width = '100%';
            statusLabel.textContent = 'Fehler bei der Verarbeitung.';
            alert('Ein Fehler ist aufgetreten: ' + error.message);
        } finally {
            startButton.disabled = false;
        }
    });
    
    // Function to read file as text with encoding detection
    async function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                
                // Check for BOM (Byte Order Mark) which indicates UTF-8
                if (content.charCodeAt(0) === 0xFEFF) {
                    // UTF-8 with BOM - remove BOM
                    resolve(content.slice(1));
                } else {
                    // Try to detect if we need to convert from Latin1/Windows-1252
                    const hasUmlauts = /[äöüÄÖÜß]/.test(content);
                    const hasEncodingIssues = /�/.test(content);
                    
                    if (hasEncodingIssues && !hasUmlauts) {
                        // Content might be in Latin1/Windows-1252 - try to convert
                        console.log('Possible encoding issue detected. Attempting to convert from Latin1/Windows-1252...');
                        
                        // Create a new FileReader to read as binary
                        const binaryReader = new FileReader();
                        binaryReader.onload = function(e) {
                            const binary = e.target.result;
                            // Convert from Latin1/Windows-1252 to UTF-8
                            let converted = '';
                            const bytes = new Uint8Array(binary);
                            for (let i = 0; i < bytes.length; i++) {
                                converted += String.fromCharCode(bytes[i]);
                            }
                            resolve(converted);
                        };
                        binaryReader.onerror = reject;
                        binaryReader.readAsArrayBuffer(file);
                    } else {
                        // Seems fine as UTF-8
                        resolve(content);
                    }
                }
            };
            reader.onerror = e => reject(e);
            reader.readAsText(file, 'UTF-8'); // First try UTF-8
        });
    }
    
    // Function to parse TXT file into structured data
    function parseTxtFile(text, fileType) {
        // Try to detect if it's tab-delimited, comma-delimited, or semicolon-delimited
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
            return [];
        }
        
        // Default to semicolon as delimiter for both files since they appear to use that
        const delimiter = ';';
        
        console.log(`Using delimiter: "${delimiter}" for ${fileType} file`);
        
        // Check if the first line looks like a header (contains quotes)
        let headerRow = 0;
        let headers;
        
        if (lines[0].includes('"')) {
            // Parse headers with quotes
            headers = parseDelimitedLine(lines[0], delimiter);
            console.log('Detected headers with quotes:', headers);
        } else {
            // Simple split on delimiter
            headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"(.*)"$/, '$1'));
            console.log('Detected headers:', headers);
        }
        
        // Parse data rows
        const data = [];
        for (let i = headerRow + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === '') continue;
            
            // Parse values with consideration for quotes
            const values = parseDelimitedLine(line, delimiter);
            const row = {};
            
            headers.forEach((header, index) => {
                if (index < values.length) {
                    let value = values[index].trim();
                    
                    // Try to convert numeric values using German number format
                    // German format: 1.234,56 = 1234.56 in US format
                    if (/^-?[\d.,]+$/.test(value)) {
                        // Keep the comma as decimal separator, remove dots
                        value = parseGermanNumber(value);
                    }
                    
                    row[header] = value;
                }
            });
            
            data.push(row);
        }
        
        console.log(`Parsed ${data.length} data rows from ${fileType} file`);
        return data;
    }
    
    // Function to parse German number format to JavaScript number
    function parseGermanNumber(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        
        // Convert from German number format to JavaScript number format
        // 1. Remove all dots (thousand separators in German)
        // 2. Replace comma with dot (decimal separator)
        const strValue = String(value).replace(/\./g, '').replace(',', '.');
        return parseFloat(strValue) || 0;
    }
    
    // Helper function to parse a delimited line with consideration for quotes
    function parseDelimitedLine(line, delimiter) {
        const result = [];
        let inQuotes = false;
        let currentValue = '';
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
                result.push(currentValue);
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        
        // Add the last value
        result.push(currentValue);
        
        // Clean up quotes from values
        return result.map(val => val.replace(/^"(.*)"$/, '$1'));
    }
    
    // Process LA data to separate into LAW and NBA tables
    function processLAData(laData) {
        const lawData = [];  // For Lohnartenwerte (when Lohnart doesn't start with 9)
        const nbaData = [];  // For NBA Daten (when Lohnart starts with 9)
        
        laData.forEach(row => {
            const lohnart = String(row["Lohnart"] || '').trim();
            const personalnummer = String(row["Personalnummer"] || '').trim();
            const bezeichnung = String(row["Bezeichnung"] || '').trim();
            const betrag = row["Betrag"]; // Keep the original format with comma
            
            // Check if Lohnart starts with 9
            if (lohnart.startsWith('9')) {
                // Add to NBA Daten
                nbaData.push({
                    "Personalnummer": personalnummer,
                    "Netto-Bezüge/ -Abzüge Nummer": lohnart,
                    "Netto-Bezüge/ -Abzüge Bezeichnung": bezeichnung,
                    "Netto-Bezüge/ -Abzüge Betrag": betrag
                });
            } else {
                // Add to Lohnartenwerte
                lawData.push({
                    "Personalnummer": personalnummer,
                    "Lohnart": lohnart,
                    "Lohnart Bezeichnung": bezeichnung,
                    "Lohnart Betrag": betrag
                });
            }
        });
        
        console.log(`Processed LA data: ${lawData.length} LAW entries, ${nbaData.length} NBA entries`);
        
        return {
            lawData,
            nbaData
        };
    }
    
    // Function to extract year and month from a date string (handling the specific format)
    function extractMonthFromDate(dateStr) {
        if (!dateStr) return "";
        
        try {
            // Check if dateStr contains the specific format pattern
            if (typeof dateStr === 'string' && dateStr.includes('YYYY-MM-DD HH:MM:SS formatted)')) {
                const match = dateStr.match(/(\d{4})-(\d{2})-\d{2}/);
                if (match) {
                    const year = match[1];
                    const month = match[2];
                    return `${year}/${month}`;
                }
            }
            
            // Try German format: DD.MM.YYYY
            if (typeof dateStr === 'string' && dateStr.includes('.')) {
                const parts = dateStr.split('.');
                if (parts.length === 3) {
                    const year = parts[2].trim();
                    const month = parts[1].trim().padStart(2, '0'); // Ensure 2 digits with leading zero
                    return `${year}/${month}`;
                }
            } 
            
            console.log("Date format not recognized, using default:", dateStr);
            return "2025/07"; // Default to July 2025 if format not recognized
            
        } catch (error) {
            console.error(`Error processing date ${dateStr}:`, error);
            return "2025/07"; // Default to July 2025 if error occurs
        }
    }
    
    // Function to merge data for the main table
    function mergeData(lohnjournalData, personalkostenData) {
        // Index LA data by personnel number for quicker lookup
        const laByPersNr = {};
        lohnjournalData.forEach(row => {
            const persNr = String(row["Personalnummer"] || '').trim();
            if (!laByPersNr[persNr]) {
                laByPersNr[persNr] = [];
            }
            laByPersNr[persNr].push(row);
        });
        
        // Initialize result array
        const mergedData = [];
        
        // Map SD data to output format
        personalkostenData.forEach((sdRow, index) => {
            const persNr = String(sdRow["Personalnummer"] || '').trim();
            
            // Look for the specific date field
            let abrechnungsdatum = ""; 
            for (const key in sdRow) {
                if (String(sdRow[key]).includes('YYYY-MM-DD HH:MM:SS formatted)')) {
                    abrechnungsdatum = sdRow[key];
                    break;
                }
            }
            
            // Calculate Pauschale Steuern (sum of Pauschale LST, KiST, and Solz)
            const pauschLST = parseGermanNumber(sdRow["Pauschale LST"] || 0);
            const pauschKiST = parseGermanNumber(sdRow["Pauschale KiST"] || 0);
            const pauschSolz = parseGermanNumber(sdRow["Pauschaler Solz"] || 0);
            const pauschaleSteuern = pauschLST + pauschKiST + pauschSolz;
            
            // Create a mapping from SD columns to output columns
            const outputRow = {
                "Nr": index + 1, // Auto-number
                "Berater": sdRow["Beraternummer"] || "",
                "Mandant": sdRow["Mandantennummer"] || "",
                "Abrechnungsmonat": extractMonthFromDate(abrechnungsdatum || sdRow["Abrechnungsdatum"] || ""),
                "Pers.Nr.": persNr,
                "betriebliche Personalnummer": "", // Not directly mapped
                "Name,Vorname (MA)": `${sdRow["Familienname"] || ""}, ${sdRow["Vorname"] || ""}`,
                "BGRS - Beitragsgruppenschlüssel": sdRow["Beitragsgruppenschlüssel"] || "",
                "Selbstzahler, freiw. KV (MA.SV.frwVers)": sdRow["Freiw KV - Gesamtbeitrag"] || 0, 
                "private Krankenversicherung (MA.SV.privVers)": sdRow["Priv KV - Gesamtbeitrag"] || 0,
                "St.Kl. - Steuerklasse": sdRow["Steuerklasse"] || 0,
                "Ki.Frb. - Kinderfreibetrag": sdRow["Kinderfreibetrag"] || "",
                "Konf.A/E - Konnfession Arbeitnehmer/Ehegatte": `${sdRow["Konfession AN"] || 0} / ${sdRow["Konfession Ehegatte"] || 0}`,
                "Freibetrag/Hinzurechnungsbetrag": sdRow["Freibetrag mtl"] || sdRow["Freibetrag jährlich"] || 0,
                "SV-Tage (BN) - Sozialversicherungstage": sdRow["Anwesenheitstage"] || 0, 
                "St.Tage - Steuertage": sdRow["Anwesenheitstage"] || 0, // Not neccessary 
                "St.Brutto - Steuerbrutto": sdRow["Steuerbrutto"] || 0,
                "BezPausch - Pauschal versteuerte Bezüge": 0, // Not directly mapped
                "LSt - Lohnsteuer": 0, // Not directly mapped
                "LStPausch - Pauschale Lohnsteuer": sdRow["Pauschale LST"] || 0,
                "KiSt - Kirchensteuer": 0, // Not directly mapped
                "KiStPausch - Pauschale Kirchensteuer": sdRow["Pauschale KiST"] || 0,
                "KiGe - Kindergeld": 0, // Not neccessary
                "SolZ - Solidaritätszuschlag": 0, // Not directly mapped
                "SolZPausch - Pauschaler Solidaritätszuschlag": sdRow["Pauschaler Solz"] || 0,
                "KV-Brutto": sdRow["KV/PV-Brutto"] || 0,
                "KV-AN-Beitrag": 0, // Not directly mapped
                "KV-AG-Beitrag": 0, // Not directly mapped
                "RV-Brutto": sdRow["RV/AV-Brutto"] || 0,
                "RV-AN-Beitrag": 0, // Not directly mapped
                "RV-AG-Beitrag": 0, // Not directly mapped
                "AV-Brutto": sdRow["RV/AV-Brutto"] || 0, // Same as RV-Brutto
                "AV-AN-Beitrag": 0, // Not directly mapped
                "AV-AG-Beitrag": 0, // Not directly mapped
                "PV-Brutto": sdRow["KV/PV-Brutto"] || 0, // Same as KV-Brutto
                "PV-AN-Beitrag": 0, // Not directly mapped
                "PV-AG-Beitrag": 0, // Not directly mapped
                "Z-KZ - PV-Beitragszuschlag für Kinderlose": 0, // Not neccessary
                "U1 - Umlage 1": 0, // Not directly mapped
                "U2 - Umlage 2": 0, // Not directly mapped
                "InsoU - Insolvenzgeldumlage": 0, // Not directly mapped
                "Gesamtbrutto": sdRow["Gesamtbrutto"] || 0,
                "Nettobezüge/-abzüge": 0, // Not directly mapped
                "Auszahlungsbetrag": sdRow["Auszahlungsbetrag Euro"] || 0,
                "*Gesamtbrutto m. bAV AG-Anteil": sdRow["Gesamtbrutto-gesamt"] || sdRow["Gesamtbrutto"] || 0,
                "bAV AG-Anteil": 0, // Not directly mapped
                "bAV Förderbetrag": 0, // Not directly mapped
                "Kostenrelevante NBA": 0, // Not neccessary
                "SV AG-Anteil": sdRow["SV-AG-Anteil mtl"] || 0,
                "Umlage": sdRow["Umlagebeiträge"] || 0,
                "Pauschale Steuern": pauschaleSteuern, // Sum of Pauschale LST, KiST, Solz
                "Steuer aktuell": 0 // Not neccessary
            };
            
            // Calculate Gesamtkosten (Total costs)
            outputRow["Gesamtkosten"] = 
                parseGermanNumber(sdRow["Gesamtbrutto"] || 0) + 
                parseGermanNumber(sdRow["SV-AG-Anteil mtl"] || 0) + 
                parseGermanNumber(sdRow["Umlagebeiträge"] || 0) + 
                pauschaleSteuern;
            
            mergedData.push(outputRow);
        });
        
        console.log(`Merged ${mergedData.length} records for main table`);
        
        return mergedData;
    }
    
    // Function to create Excel file
    function createExcelFile(data, filename, bAVspecialcode, NBAspecialcode) {
        const workbook = XLSX.utils.book_new();
        
        // Define column order for first sheet 
        const requiredColumnOrder = [
            "Nr", "Berater", "Mandant", "Abrechnungsmonat", "Pers.Nr.", "betriebliche Personalnummer",
            "Name,Vorname (MA)", "BGRS - Beitragsgruppenschlüssel", "Selbstzahler, freiw. KV (MA.SV.frwVers)",
            "private Krankenversicherung (MA.SV.privVers)", "St.Kl. - Steuerklasse", "Ki.Frb. - Kinderfreibetrag",
            "Konf.A/E - Konnfession Arbeitnehmer/Ehegatte", "Freibetrag/Hinzurechnungsbetrag",
            "SV-Tage (BN) - Sozialversicherungstage", "St.Tage - Steuertage", "St.Brutto - Steuerbrutto",
            "BezPausch - Pauschal versteuerte Bezüge", "LSt - Lohnsteuer", "LStPausch - Pauschale Lohnsteuer",
            "KiSt - Kirchensteuer", "KiStPausch - Pauschale Kirchensteuer", "KiGe - Kindergeld",
            "SolZ - Solidaritätszuschlag", "SolZPausch - Pauschaler Solidaritätszuschlag", "KV-Brutto",
            "KV-AN-Beitrag", "KV-AG-Beitrag", "RV-Brutto", "RV-AN-Beitrag", "RV-AG-Beitrag", "AV-Brutto",
            "AV-AN-Beitrag", "AV-AG-Beitrag", "PV-Brutto", "PV-AN-Beitrag", "PV-AG-Beitrag",
            "Z-KZ - PV-Beitragszuschlag für Kinderlose", "U1 - Umlage 1", "U2 - Umlage 2", 
            "InsoU - Insolvenzgeldumlage", "Gesamtbrutto", "Nettobezüge/-abzüge", "Auszahlungsbetrag",
            "*Gesamtbrutto m. bAV AG-Anteil", "bAV AG-Anteil", "bAV Förderbetrag", "Kostenrelevante NBA",
            "SV AG-Anteil", "Umlage", "Pauschale Steuern", "Gesamtkosten", "Steuer aktuell"
        ];
        
        // 1. Create main sheet: Zusammengeführte Daten
        const ws1 = XLSX.utils.aoa_to_sheet([requiredColumnOrder]);
        
        // Add data rows
        if (data.merged_df_all && data.merged_df_all.length > 0) {
            data.merged_df_all.forEach((row, idx) => {
                // Create a row with cells in the specified order
                const orderedRow = requiredColumnOrder.map(col => {
                    const value = row[col];
                    if (value !== undefined && value !== null && value !== "") {
                        // Return as is, preserving German number format
                        return value;
                    } else {
                        // Use default based on column type - numbers get 0, others get empty string
                        return col.match(/brutto|summe|betrag|kosten|umlage|steuer|beitrag|freibetrag|tage/i) ? 0 : '';
                    }
                });
                
                // Add row to worksheet (starting at row 2, since row 1 is headers)
                XLSX.utils.sheet_add_aoa(ws1, [orderedRow], { origin: { r: idx + 1, c: 0 } });
            });
        }
        XLSX.utils.book_append_sheet(workbook, ws1, 'Zusammengeführte Daten');
        
        // 2. Create Lohnartenwerte sheet
        let ws2;
        
        // The data is already filtered in the main script, but we'll ensure the filtering happens here as well
        let filteredLawData = data.combined_law_df;
        if (bAVspecialcode && bAVspecialcode.trim() !== '') {
            const bAVCodes = bAVspecialcode.split(',').map(code => code.trim()).filter(code => code !== '');
            if (bAVCodes.length > 0) {
                const originalCount = filteredLawData.length;
                filteredLawData = filteredLawData.filter(row => !bAVCodes.includes(String(row["Lohnart"])));
                console.log(`createExcelFile: Filtered out ${originalCount - filteredLawData.length} rows from Lohnartenwerte with bAV codes: ${bAVCodes.join(', ')}`);
            }
        }
        
        if (filteredLawData && filteredLawData.length > 0) {
            ws2 = XLSX.utils.json_to_sheet(filteredLawData);
        } else {
            // Create empty sheet with headers
            ws2 = XLSX.utils.aoa_to_sheet([["Personalnummer", "Lohnart", "Lohnart Bezeichnung", "Lohnart Betrag"]]);
        }
        XLSX.utils.book_append_sheet(workbook, ws2, 'Lohnartenwerte');
        
        // 3. Create NBA Daten sheet
        let ws3;
        
        // The data is already filtered in the main script, but we'll ensure the filtering happens here as well
        let filteredNbaData = data.combined_nba_df;
        if (NBAspecialcode && NBAspecialcode.trim() !== '') {
            const NBACodes = NBAspecialcode.split(',').map(code => code.trim()).filter(code => code !== '');
            if (NBACodes.length > 0) {
                const originalCount = filteredNbaData.length;
                filteredNbaData = filteredNbaData.filter(row => !NBACodes.includes(String(row["Netto-Bezüge/ -Abzüge Nummer"])));
                console.log(`createExcelFile: Filtered out ${originalCount - filteredNbaData.length} rows from NBA Daten with NBA codes: ${NBACodes.join(', ')}`);
            }
        }
        
        if (filteredNbaData && filteredNbaData.length > 0) {
            ws3 = XLSX.utils.json_to_sheet(filteredNbaData);
        } else {
            // Create empty sheet with headers
            ws3 = XLSX.utils.aoa_to_sheet([["Personalnummer", "Netto-Bezüge/ -Abzüge Nummer", "Netto-Bezüge/ -Abzüge Bezeichnung", "Netto-Bezüge/ -Abzüge Betrag"]]);
        }
        XLSX.utils.book_append_sheet(workbook, ws3, 'NBA Daten');
        
        // Generate Excel file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }
});