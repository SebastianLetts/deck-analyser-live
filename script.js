// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const heroSection = document.getElementById('hero');
const processingSection = document.getElementById('processing');
const processingStatus = document.getElementById('processing-status');
const resultsSection = document.getElementById('results');
const upsellContainer = document.getElementById('upsell-container');
const resetBtn = document.getElementById('reset-btn');

// --- Event Listeners ---

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
        handleFileUpload(files[0]);
    } else {
        alert('Please upload a valid PDF file.');
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
    }
});

resetBtn.addEventListener('click', () => {
    resultsSection.classList.add('hidden');
    upsellContainer.classList.add('hidden');
    heroSection.classList.remove('hidden');
    fileInput.value = '';
});

const analystNoteContainer = document.getElementById('analyst-note-container');
const downloadNoteBtn = document.getElementById('download-note-btn');
const copyNoteBtn = document.getElementById('copy-note-btn');

// --- Event Listeners ---

copyNoteBtn.addEventListener('click', () => {
    copyNoteToClipboard();
});

downloadNoteBtn.addEventListener('click', () => {
    downloadNoteAsPDF();
});

function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function copyNoteToClipboard() {
    const noteContent = document.getElementById('analyst-note-content');
    let text = "";

    // Iterate through sections to get clean text
    const sections = noteContent.querySelectorAll('.note-section');
    sections.forEach(section => {
        const title = section.querySelector('h3').innerText;
        const body = section.querySelector('.note-text')?.innerText || "";
        text += `${title}\n${body}\n\n`;
    });

    // Add waiver
    const waiver = noteContent.querySelector('.note-waiver p').innerText;
    text += `Standard Waiver:\n${waiver}`;

    navigator.clipboard.writeText(text).then(() => {
        showToast('Analyst Note copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy text. Please try selecting and copying manually.');
    });
}

function downloadNoteAsPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;

    const filename = `PitchDeck_Analyzer_${new Date().toISOString().split('T')[0]}.pdf`;

    // Helper: Add text with word wrap
    function addText(text, fontSize, isBold, color) {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setTextColor(color[0], color[1], color[2]);

        const lines = doc.splitTextToSize(text, contentWidth);
        const lineHeight = fontSize * 0.4;

        for (let i = 0; i < lines.length; i++) {
            if (y + lineHeight > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
            doc.text(lines[i], margin, y);
            y += lineHeight;
        }
        return y;
    }

    // Helper: Add section heading
    function addHeading(text) {
        if (y + 15 > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
        y += 5;
        doc.setFillColor(0, 51, 102);
        doc.rect(margin, y - 4, 3, 10, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text(text, margin + 6, y + 3);
        y += 12;
    }

    // Helper: Add chart image
    function addChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            const imgData = canvas.toDataURL('image/png', 1.0);
            const chartHeight = 60;

            if (y + chartHeight > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }

            doc.addImage(imgData, 'PNG', margin, y, contentWidth, chartHeight);
            y += chartHeight + 5;
        }
    }

    // --- Build PDF Content ---

    // Header
    doc.setFillColor(0, 51, 102);
    doc.rect(margin, y, 50, 7, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('ECM ANALYST NOTE', margin + 2, y + 5);
    y += 12;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 34, 68);
    doc.text('Investment Banking Professional Draft', margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | Prepared by: LettsApps AI Research`, margin, y);
    y += 5;

    // Divider line
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Section 1: Executive Summary
    addHeading('1. Executive Summary & Introduction');
    const introText = document.getElementById('note-intro')?.innerText || '';
    addText(introText, 11, false, [44, 62, 80]);
    y += 5;

    // Section 2: Problem & Offering
    addHeading('2. Key Customer Problem & Offering');
    const offeringText = document.getElementById('note-offering')?.innerText || '';
    addText(offeringText, 11, false, [44, 62, 80]);
    y += 5;

    // Section 3: Market Opportunity
    addHeading('3. Market Opportunity & Competitive Landscape');
    addChart('marketChart');
    const marketText = document.getElementById('note-market')?.innerText || '';
    addText(marketText, 11, false, [44, 62, 80]);
    y += 5;

    // Section 4: Traction & KPIs
    addHeading('4. Traction & Core KPIs');
    addChart('tractionChart');
    const tractionText = document.getElementById('note-traction')?.innerText || '';
    addText(tractionText, 11, false, [44, 62, 80]);
    y += 5;

    // Section 5: Team
    addHeading('5. Management Team & Execution Capability');
    const teamText = document.getElementById('note-team')?.innerText || '';
    addText(teamText, 11, false, [44, 62, 80]);
    y += 5;

    // Section 6: Financials
    addHeading('6. Summary Pro Forma Financial Forecast');
    addChart('financialChart');
    const financialsText = document.getElementById('note-financials')?.innerText || '';
    addText(financialsText, 11, false, [44, 62, 80]);
    y += 5;

    // Section 7: Conclusion
    addHeading('7. Investment Conclusion');
    const conclusionText = document.getElementById('note-conclusion')?.innerText || '';
    addText(conclusionText, 11, false, [44, 62, 80]);
    y += 10;

    // Waiver
    if (y + 30 > pageHeight - margin) {
        doc.addPage();
        y = margin;
    }
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 35, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Standard Waiver:', margin + 3, y + 6);
    doc.setFont('helvetica', 'normal');
    const waiverText = 'This document is generated by Artificial Intelligence based on the provided pitch deck. AI can make mistakes or hallucinate information. This note should be treated purely as a draft for professional review and does not constitute financial or investment advice. Users must verify all data points before making any commercial decisions.';
    const waiverLines = doc.splitTextToSize(waiverText, contentWidth - 6);
    doc.text(waiverLines, margin + 3, y + 12);

    // Save the PDF
    doc.save(filename);
}

// --- Core Logic ---

function updateProcessingStatus(message) {
    processingStatus.style.opacity = '0';
    setTimeout(() => {
        processingStatus.innerText = message;
        processingStatus.style.opacity = '1';
    }, 200);
}

async function handleFileUpload(file) {
    // UI Transitions
    dropZone.classList.add('hidden');
    processingSection.classList.remove('hidden');
    updateProcessingStatus('Extracting text from PDF...');

    try {
        const text = await extractTextFromPDF(file);

        // Always try AI analysis first via server proxy
        updateProcessingStatus('Running AI-powered deep analysis...');
        try {
            const analysis = await analyzeWithAI(text);
            displayResults(analysis);
        } catch (aiError) {
            console.warn('AI analysis unavailable, using structural analysis:', aiError.message);
            updateProcessingStatus('Completing structural analysis...');
            await new Promise(r => setTimeout(r, 800));
            const analysis = analyzeDeckRegex(text);
            displayResults(analysis);
        }
    } catch (error) {
        console.error('Extraction error:', error);
        alert('Failed to process PDF. Please try again.');
        dropZone.classList.remove('hidden');
        processingSection.classList.add('hidden');
    }
}

async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        fullText += strings.join(' ') + '\n';
    }

    return fullText;
}

function analyzeDeckRegex(text) {
    const lowercaseText = text.toLowerCase();

    let companyName = "the company";
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const sections = {
        'Problem': /problem|pain point|challenge/i.test(lowercaseText),
        'Solution': /solution|product|our way/i.test(lowercaseText),
        'Market Size': /market|tam|sam|som|addressable/i.test(lowercaseText),
        'Business Model': /business model|revenue|monetization|how we make money/i.test(lowercaseText),
        'Competition': /competition|competitors|landscape/i.test(lowercaseText),
        'Team': /team|founders|leadership/i.test(lowercaseText),
        'Financials': /financials|projections|forecast/i.test(lowercaseText),
        'Ask/Timeline': /the ask|fundraising|round|milestone|roadmap/i.test(lowercaseText)
    };

    let stage = 'Unknown';
    let valuation = 'N/A';

    if (/pre-seed|ideation/i.test(lowercaseText)) {
        stage = 'Pre-Seed';
        valuation = '$500k - $2M';
    } else if (/seed|angel/i.test(lowercaseText)) {
        stage = 'Seed';
        valuation = '$2M - $8M';
    } else if (/series a/i.test(lowercaseText)) {
        stage = 'Series A';
        valuation = '$10M - $30M';
    } else if (/series b/i.test(lowercaseText)) {
        stage = 'Series B';
        valuation = '$30M - $100M';
    } else {
        if (lowercaseText.includes('revenue') && lowercaseText.includes('traction')) {
            stage = 'Seed/Series A';
            valuation = '$5M - $15M';
        } else {
            stage = 'Pre-Seed/Seed';
            valuation = '$1M - $4M';
        }
    }

    const foundSections = Object.values(sections).filter(Boolean).length;
    let score = Math.round((foundSections / Object.keys(sections).length) * 10);

    if (lowercaseText.includes('exit strategy')) score = Math.min(10, score + 1);
    if (lowercaseText.includes('moat') || lowercaseText.includes('defensibility')) score = Math.min(10, score + 1);

    const feedback = [];
    if (!sections.Financials) feedback.push({ title: 'Add Financials', body: 'Investors need to see 3-5 year revenue projections and your burn rate.' });
    if (!sections['Market Size']) feedback.push({ title: 'Market Validation', body: 'Define your TAM/SAM/SOM clearly to show the scale of the opportunity.' });
    if (!sections.Competition) feedback.push({ title: 'Competitive Landscape', body: 'A 2x2 matrix or comparison table helps investors understand your unique advantage.' });

    if (score > 8) {
        feedback.push({ title: 'Strong Structure', body: 'Your deck follows the standard investor narrative very well. Keep it concise.' });
    } else {
        feedback.push({ title: 'Narrative Flow', body: 'Consider re-ordering slides to tell a more compelling story.' });
    }

    return {
        companyName,
        score,
        stage,
        valuation,
        sections,
        feedback,
        rawText: text,
        aiPowered: false,
        // Template-based note content (fallback)
        noteContent: null
    };
}

// --- AI-Powered Analysis via Server Proxy ---

async function analyzeWithAI(text) {
    updateProcessingStatus('Sending deck to AI for deep analysis...');

    const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deckText: text })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    updateProcessingStatus('Processing AI response...');

    const parsed = await response.json();

    // Validate required fields
    if (!parsed.score || !parsed.sections || !parsed.noteIntro) {
        throw new Error('AI response missing required fields');
    }

    return {
        companyName: parsed.companyName || 'the Company',
        score: Math.min(10, Math.max(1, parsed.score)),
        stage: parsed.stage || 'Unknown',
        valuation: parsed.valuation || 'N/A',
        sections: parsed.sections,
        feedback: parsed.feedback || [],
        rawText: text,
        aiPowered: true,
        scoreSummary: parsed.scoreSummary,
        noteContent: {
            intro: parsed.noteIntro,
            offering: parsed.noteOffering,
            market: parsed.noteMarket,
            traction: parsed.noteTraction,
            team: parsed.noteTeam,
            financials: parsed.noteFinancials,
            conclusion: parsed.noteConclusion
        },
        chartData: parsed.chartData || null
    };
}

function displayResults(analysis) {
    processingSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');

    // Display Score
    document.getElementById('total-rating').innerText = `${analysis.score}/10`;

    // Display Stars
    const starsContainer = document.getElementById('score-stars');
    starsContainer.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        const star = document.createElement('i');
        star.className = i <= analysis.score ? 'fas fa-star star' : 'far fa-star star empty';
        starsContainer.appendChild(star);
    }

    // Company Info
    document.getElementById('company-stage').innerText = analysis.stage;
    document.getElementById('valuation-range').innerText = analysis.valuation;

    // Checklist
    const checklist = document.getElementById('section-checklist');
    checklist.innerHTML = '';
    for (const [name, found] of Object.entries(analysis.sections)) {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fas ${found ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${name}`;
        checklist.appendChild(li);
    }

    // Feedback
    const feedbackList = document.getElementById('feedback-list');
    feedbackList.innerHTML = '';
    analysis.feedback.forEach(item => {
        const div = document.createElement('div');
        div.className = 'feedback-item';
        div.innerHTML = `<h4>${item.title}</h4><p>${item.body}</p>`;
        feedbackList.appendChild(div);
    });

    const summaryText = analysis.scoreSummary
        ? analysis.scoreSummary
        : (analysis.score >= 7
            ? "Excellent foundation. Focus on refining your financial projections."
            : "Good start, but missing some critical investor sections.");
    document.getElementById('score-summary').innerText = summaryText;

    // Generate and display Analyst Note
    generateAnalystNote(analysis);

    // Show sections
    analystNoteContainer.classList.remove('hidden');
    upsellContainer.classList.remove('hidden');
}

function generateAnalystNote(analysis) {
    const { stage, valuation, sections } = analysis;
    const companyName = analysis.companyName || "the Company";

    if (analysis.noteContent) {
        // AI-powered content
        document.getElementById('note-intro').innerText = analysis.noteContent.intro;
        document.getElementById('note-offering').innerText = analysis.noteContent.offering;
        document.getElementById('note-market').innerText = analysis.noteContent.market;
        document.getElementById('note-traction').innerText = analysis.noteContent.traction;
        document.getElementById('note-team').innerText = analysis.noteContent.team;
        document.getElementById('note-financials').innerText = analysis.noteContent.financials;
        document.getElementById('note-conclusion').innerText = analysis.noteContent.conclusion;
    } else {
        // Fallback template content
        document.getElementById('note-intro').innerText = `We present a comprehensive review of ${companyName}, a high-growth startup currently positioned at the ${stage} stage. Our analysis indicates a valuation range of ${valuation}. ${companyName} demonstrates a ${analysis.score >= 7 ? 'robust' : 'developing'} investment narrative with a clear focus on scale. This initial note synthesizes the core value proposition and market dynamics observed in the provided collateral.\n\nThe Company is operating in a rapidly evolving ecosystem where agility and data-driven execution are paramount. Our ECM research team has evaluated the deck against standard institutional benchmarks to provide this initial assessment.`;

        document.getElementById('note-offering').innerText = `The core customer problem addressed by ${companyName} centers on ${sections.Problem ? 'verified friction points within their target vertical' : 'inefficiencies identified in current market workflows'}. Their offering is designed to provide a ${sections.Solution ? 'compelling solution-level intervention' : 'significant improvement over legacy alternatives'}.\n\nMarket-wide adoption of such technologies is currently driven by a shift toward more integrated, user-centric platforms. ${companyName} appears to be leveraging this trend by offering a scalable product that prioritizes both impact and ease of integration for the end customer.`;

        document.getElementById('note-market').innerText = `The addressable market for ${companyName} is significant, with current estimates suggesting a multi-billion dollar Total Addressable Market (TAM). ${sections['Market Size'] ? 'The deck provides clear validation of these figures' : 'While early, the opportunity suggests immense room for expansion'}.\n\nCompetitive analysis indicates that while incumbents exist, ${companyName} maintains ${analysis.rawText.includes('moat') ? 'a defensible technological advantage' : 'a strong first-mover or niche positioning'}. We expect the competitive landscape to consolidate as winners emerge in the ${stage} category.`;

        document.getElementById('note-traction').innerText = `Traction to date shows a ${sections.Financials ? 'consistent growth trajectory' : 'promising early-stage momentum'}. Key Performance Indicators (KPIs) suggest strong product-market fit. ${companyName} is currently focusing on user acquisition and ${sections['Business Model'] ? 'monetization efficiency' : 'optimizing their core retention loop'}.\n\nInstitutional investors typically look for the 'hockey stick' growth pattern demonstrated here, provided execution remains consistent with the current roadmap.`;

        document.getElementById('note-team').innerText = `The management team behind ${companyName} possesses a ${sections.Team ? 'strong blend of technical and commercial expertise' : 'foundational set of skills required for this stage'}. The founders have demonstrated early resilience and a clear vision for the company's future.\n\nExecution capability is reinforced by the team's ability to ${analysis.rawText.includes('milestone') ? 'hit key historical milestones' : 'articulate a cogent strategy for the upcoming fiscal quarters'}. Investors often bet on the 'jockey' as much as the 'horse', and this team shows significant promise.`;

        document.getElementById('note-financials').innerText = `Pro forma financial forecasts for ${companyName} indicate a path to ${sections.Financials ? 'profitability within the next 36-48 months' : 'significant scale and subsequent exit opportunity'}. The capital efficiency of the business model is a standout feature.\n\nWe anticipate a requirement for follow-on funding to maintain the current growth delta, as outlined in the fundraising roadmap. The projected ROI for early-stage participants remains highly attractive given the current entry valuation.`;

        document.getElementById('note-conclusion').innerText = `In conclusion, ${companyName} represents a ${analysis.score >= 8 ? 'top-tier' : 'compelling'} investment opportunity in the ${stage} space. The alignment of product, market, and team suggests a high probability of successful execution. We recommend further due diligence to validate the underlying assumptions of the growth model.\n\nThis note serves as an initial primer for institutional stakeholders looking to understand the core drivers of ${companyName}'s future performance.`;
    }

    // Render Charts
    renderCharts(analysis);
}

function renderCharts(analysis) {
    const cd = analysis.chartData || {};

    // Destroy existing charts to avoid canvas reuse errors
    Chart.helpers.each(Chart.instances, (instance) => instance.destroy());

    const somVal = cd.marketSOM || 15;
    const samVal = cd.marketSAM || 35;
    const otherVal = Math.max(0, 100 - somVal - samVal);

    // 1. Market Chart (Pie)
    const marketCtx = document.getElementById('marketChart').getContext('2d');
    new Chart(marketCtx, {
        type: 'doughnut',
        data: {
            labels: ['SOM (Serviceable Obtainable Market)', 'SAM (Serviceable Addressable Market)', 'Other'],
            datasets: [{
                data: [somVal, samVal, otherVal],
                backgroundColor: ['#003366', '#004d99', '#f0f4f8']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { title: { display: true, text: 'Market Share Opportunity' } }
        }
    });

    // 2. Traction Chart (Line)
    const tractionData = cd.tractionData || [10, 25, 45, 80, 150, 280];
    const tractionCtx = document.getElementById('tractionChart').getContext('2d');
    new Chart(tractionCtx, {
        type: 'line',
        data: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q1 (Proj)', 'Q2 (Proj)'],
            datasets: [{
                label: 'User Growth / Revenue Index',
                data: tractionData,
                borderColor: '#003366',
                fill: true,
                backgroundColor: 'rgba(0, 51, 102, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { title: { display: true, text: 'Traction & Growth Velocity' } }
        }
    });

    // 3. Financial Chart (Bar)
    const revData = cd.revenueProjection || [100, 450, 1200, 3500];
    const expData = cd.expenseProjection || [350, 700, 1000, 2000];
    const financialCtx = document.getElementById('financialChart').getContext('2d');
    new Chart(financialCtx, {
        type: 'bar',
        data: {
            labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4'],
            datasets: [
                {
                    label: 'Revenue',
                    data: revData,
                    backgroundColor: '#003366'
                },
                {
                    label: 'Expenses',
                    data: expData,
                    backgroundColor: '#cc0000'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { title: { display: true, text: 'Summary Pro Forma ($000s)' } }
        }
    });
}
