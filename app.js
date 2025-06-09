// Aplikācijas inicializācija
function initializeApp() {
    // Pārbaudīt lietotāja sesiju
    checkUserSession();
    
    // Iestatīt navigāciju
    setupNavigation();
    
    // Ielādēt sākuma lapu
    showSection('dashboard');
    
    // Iestatīt auto-save
    setupAutoSave();
    
    // Inicializēt diagrammas
    initializeCharts();
}

// Notikumu klausītāju iestatīšana
function setupEventListeners() {
    // Navigācijas klikšķi
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavClick);
    });

    // Mobile menu toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Modal aizvēršana
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });

    // Formu iesniegšana
    const riskAssessmentForm = document.getElementById('riskAssessmentForm');
    if (riskAssessmentForm) {
        riskAssessmentForm.addEventListener('submit', handleAssessmentSubmit);
    }

    const addToolForm = document.getElementById('addToolForm');
    if (addToolForm) {
        addToolForm.addEventListener('submit', handleAddToolSubmit);
    }

    // Klaviatūras saīsnes
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Navigācijas iestatīšana
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Noņemt active klasi no visiem linkiem
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Pievienot active klasi pašreizējam linkam
            link.classList.add('active');
            
            // Parādīt atbilstošo sekciju
            const section = link.getAttribute('data-section');
            showSection(section);
        });
    });
}

// Sekcijas parādīšana
function showSection(sectionName) {
    // Paslēpt visas sekcijas
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Parādīt izvēlēto sekciju
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Ielādēt sekcijas datus
        loadSectionData(sectionName);
    }
}

// Sekcijas datu ielāde
async function loadSectionData(sectionName) {
    showLoading(true);
    
    try {
        switch (sectionName) {
            case 'dashboard':
                await loadDashboardData();
                break;
            case 'tools':
                await loadToolsData();
                break;
            case 'assessments':
                await loadAssessmentsData();
                break;
            case 'reports':
                await loadReportsData();
                break;
        }
    } catch (error) {
        console.error('Kļūda ielādējot sekcijas datus:', error);
        showNotification('Kļūda ielādējot datus', 'error');
    } finally {
        showLoading(false);
    }
}

// Dashboard datu ielāde
async function loadDashboardData() {
    try {
        const [stats, recentAssessments, riskDistribution] = await Promise.all([
            fetchAPI('/dashboard/stats'),
            fetchAPI('/dashboard/recent-assessments'),
            fetchAPI('/dashboard/risk-distribution')
        ]);

        updateDashboardStats(stats);
        updateRecentAssessments(recentAssessments);
        updateRiskDistributionChart(riskDistribution);
    } catch (error) {
        console.error('Kļūda ielādējot dashboard datus:', error);
    }
}

// Dashboard statistikas atjaunināšana
function updateDashboardStats(stats) {
    document.getElementById('highRiskCount').textContent = stats.highRiskCount || 0;
    document.getElementById('pendingAssessments').textContent = stats.pendingAssessments || 0;
    document.getElementById('completedAssessments').textContent = stats.completedAssessments || 0;
    document.getElementById('totalTools').textContent = stats.totalTools || 0;
}

// Pēdējo vērtējumu atjaunināšana
function updateRecentAssessments(assessments) {
    const container = document.getElementById('recentAssessments');
    
    if (!assessments || assessments.length === 0) {
        container.innerHTML = '<p class="no-data">Nav pēdējo vērtējumu</p>';
        return;
    }

    const html = assessments.map(assessment => `
        <div class="recent-item">
            <div class="recent-title">${assessment.toolName}</div>
            <div class="recent-meta">
                <span class="risk-badge ${assessment.riskLevel.toLowerCase().replace('_', '-')}">${formatRiskLevel(assessment.riskLevel)}</span>
                <span class="recent-date">${formatDate(assessment.createdAt)}</span>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

// MI rīku datu ielāde
async function loadToolsData() {
    try {
        const tools = await fetchAPI(API_ENDPOINTS.tools);
        aiTools = tools;
        renderToolsGrid(tools);
        populateToolSelect(tools);
    } catch (error) {
        console.error('Kļūda ielādējot MI rīkus:', error);
    }
}

// MI rīku režģa renderēšana
function renderToolsGrid(tools) {
    const container = document.getElementById('toolsGrid');
    
    if (!tools || tools.length === 0) {
        container.innerHTML = '<div class="no-data">Nav pievienoti MI rīki</div>';
        return;
    }

    const html = tools.map(tool => `
        <div class="tool-card">
            <div class="tool-header">
                <div>
                    <div class="tool-title">${tool.toolName}</div>
                    <div class="tool-developer">${tool.developer || 'Nav norādīts'}</div>
                </div>
                <span class="tool-status ${tool.status.toLowerCase().replace('_', '-')}">${formatStatus(tool.status)}</span>
            </div>
            <div class="tool-description">${tool.functionality}</div>
            <div class="tool-meta">
                <span>Atbildīgā vienība: ${tool.responsibleUnit || 'Nav norādīta'}</span>
                <span>Izveidots: ${formatDate(tool.createdAt)}</span>
            </div>
            <div class="tool-actions">
                <button class="btn btn-primary btn-sm" onclick="editTool(${tool.id})">
                    <i class="fas fa-edit"></i> Rediģēt
                </button>
                <button class="btn btn-secondary btn-sm" onclick="createAssessment(${tool.id})">
                    <i class="fas fa-clipboard-list"></i> Vērtēt
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteTool(${tool.id})">
                    <i class="fas fa-trash"></i> Dzēst
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

// MI rīku filtrēšana
function filterTools() {
    const statusFilter = document.getElementById('toolStatusFilter').value;
    const searchTerm = document.getElementById('toolSearchInput').value.toLowerCase();
    
    let filteredTools = aiTools;
    
    if (statusFilter) {
        filteredTools = filteredTools.filter(tool => tool.status === statusFilter);
    }
    
    if (searchTerm) {
        filteredTools = filteredTools.filter(tool => 
            tool.toolName.toLowerCase().includes(searchTerm) ||
            (tool.developer && tool.developer.toLowerCase().includes(searchTerm)) ||
            tool.functionality.toLowerCase().includes(searchTerm)
        );
    }
    
    renderToolsGrid(filteredTools);
}

// Vērtējumu datu ielāde
async function loadAssessmentsData() {
    try {
        const assessments = await fetchAPI(API_ENDPOINTS.assessments);
        renderAssessmentsTable(assessments);
    } catch (error) {
        console.error('Kļūda ielādējot vērtējumus:', error);
    }
}

// Vērtējumu tabulas renderēšana
function renderAssessmentsTable(assessments) {
    const tbody = document.getElementById('assessmentsTableBody');
    
    if (!assessments || assessments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">Nav veikti vērtējumi</td></tr>';
        return;
    }

    const html = assessments.map(assessment => `
        <tr>
            <td>${assessment.toolName}</td>
            <td>${assessment.assessmentVersion}</td>
            <td><span class="risk-badge ${assessment.aiActRiskLevel.toLowerCase().replace('_', '-')}">${formatRiskLevel(assessment.aiActRiskLevel)}</span></td>
            <td><span class="tool-status ${assessment.overallStatus.toLowerCase().replace('_', '-')}">${formatStatus(assessment.overallStatus)}</span></td>
            <td>${assessment.assessorName}</td>
            <td>${formatDate(assessment.createdAt)}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewAssessment(${assessment.id})">
                    <i class="fas fa-eye"></i> Skatīt
                </button>
                <button class="btn btn-secondary btn-sm" onclick="editAssessment(${assessment.id})">
                    <i class="fas fa-edit"></i> Rediģēt
                </button>
                <button class="btn btn-success btn-sm" onclick="exportAssessment(${assessment.id})">
                    <i class="fas fa-download"></i> Eksportēt
                </button>
            </td>
        </tr>
    `).join('');

    tbody.innerHTML = html;
}

// Sākuma datu ielāde
async function loadInitialData() {
    try {
        const riskFactorsData = await fetchAPI(API_ENDPOINTS.riskFactors);
        riskFactors = riskFactorsData;
    } catch (error) {
        console.error('Kļūda ielādējot risku faktorus:', error);
    }
}

// MI rīka pievienošanas modāļa parādīšana
function showAddToolModal() {
    showModal('addToolModal');
    document.getElementById('addToolForm').reset();
}

// Vērtējuma izveidošanas modāļa parādīšana
function showCreateAssessmentModal() {
    showModal('assessmentModal');
    document.getElementById('riskAssessmentForm').reset();
    currentStep = 1;
    showStep(1);
    populateToolSelect(aiTools);
}

// Konkrēta MI rīka vērtējuma izveidošana
function createAssessment(toolId) {
    showCreateAssessmentModal();
    
    // Iestatīt izvēlēto MI rīku
    const toolSelect = document.getElementById('aiToolSelect');
    if (toolSelect) {
        toolSelect.value = toolId;
    }
}

// Modāļa parādīšana
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

// Modāļa aizvēršana
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Formas soļa maiņa
function changeStep(direction) {
    const newStep = currentStep + direction;
    
    if (newStep < 1 || newStep > totalSteps) {
        return;
    }

    // Validēt pašreizējo soli pirms pāriet uz nākamo
    if (direction > 0 && !validateCurrentStep()) {
        return;
    }

    currentStep = newStep;
    showStep(currentStep);
}

// Soļa parādīšana
function showStep(step) {
    // Paslēpt visus soļus
    document.querySelectorAll('.form-step').forEach(stepEl => {
        stepEl.classList.remove('active');
    });

    // Parādīt pašreizējo soli
    const currentStepEl = document.querySelector(`[data-step="${step}"]`);
    if (currentStepEl) {
        currentStepEl.classList.add('active');
    }

    // Atjaunināt soļu indikatoru
    updateStepIndicator();

    // Atjaunināt pogas
    updateNavigationButtons();

    // Ielādēt soļa specifiskos datus
    loadStepData(step);
}

// Soļu indikatora atjaunināšana
function updateStepIndicator() {
    const indicators = document.querySelectorAll('.step');
    
    indicators.forEach((indicator, index) => {
        indicator.classList.remove('active', 'completed');
        
        if (index + 1 === currentStep) {
            indicator.classList.add('active');
        } else if (index + 1 < currentStep) {
            indicator.classList.add('completed');
        }
    });
}

// Navigācijas pogu atjaunināšana
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    // Atpakaļ poga
    if (prevBtn) {
        prevBtn.style.display = currentStep === 1 ? 'none' : 'inline-flex';
    }

    // Tālāk/Iesniegt pogas
    if (currentStep === totalSteps) {
        if (nextBtn) nextBtn.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'inline-flex';
    } else {
        if (nextBtn) nextBtn.style.display = 'inline-flex';
        if (submitBtn) submitBtn.style.display = 'none';
    }
}

// Soļa datu ielāde
function loadStepData(step) {
    switch (step) {
        case 1:
            // Vispārīga informācija - jau ielādēta
            break;
        case 2:
            // Datu ierobežojumi - nav nepieciešama papildu ielāde
            break;
        case 3:
            // MI akta riska līmenis - nav nepieciešama papildu ielāde
            break;
        case 4:
            // Risku matrica
            renderRiskFactorsMatrix();
            break;
        case 5:
            // Riska mazināšanas pasākumi
            generateMitigationActions();
            break;
    }
}

// Pašreizējā soļa validācija
function validateCurrentStep() {
    const currentStepEl = document.querySelector(`[data-step="${currentStep}"]`);
    if (!currentStepEl) return true;

    const requiredFields = currentStepEl.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.style.borderColor = '#e74c3c';
            
            // Noņemt kļūdas stilu pēc 3 sekundēm
            setTimeout(() => {
                field.style.borderColor = '';
            }, 3000);
        }
    });

    // Pārbaudīt specifiskās validācijas katram solim
    switch (currentStep) {
        case 2:
            // Pārbaudīt datu ierobežojumu izvēli
            const restrictedDataRadio = document.querySelector('input[name="usesRestrictedData"]:checked');
            if (!restrictedDataRadio) {
                isValid = false;
                showNotification('Lūdzu izvēlieties atbildi par ierobežotas pieejamības informāciju', 'warning');
            }
            break;
        case 3:
            // Pārbaudīt MI akta riska līmeņa izvēli
            const riskLevel = document.getElementById('aiActRiskLevel').value;
            if (!riskLevel) {
                isValid = false;
                showNotification('Lūdzu izvēlieties MI akta riska līmeni', 'warning');
            }
            break;
        case 4:
            // Pārbaudīt risku matricas aizpildīšanu
            if (!validateRiskMatrix()) {
                isValid = false;
                showNotification('Lūdzu novērtējiet visus risku faktorus', 'warning');
            }
            break;
    }

    if (!isValid) {
        showNotification('Lūdzu aizpildiet visus obligātos laukus!', 'error');
    }

    return isValid;
}

// Ierobežotas piekļuves datu maiņas apstrāde
function handleRestrictedDataChange(radio) {
    const warningBox = document.getElementById('restrictedDataWarning');
    const explanationField = document.getElementById('restrictedDataExplanation');
    
    if (radio.value === 'true') {
        warningBox.style.display = 'block';
        explanationField.style.display = 'block';
        
        // Neļaut turpināt, ja izvēlas "Jā"
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.disabled = true;
            nextBtn.innerHTML = '<i class="fas fa-ban"></i> Nav turpināms';
        }
    } else {
        warningBox.style.display = 'none';
        explanationField.style.display = 'none';
        
        // Atjaunot "Tālāk" pogu
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.innerHTML = 'Tālāk <i class="fas fa-arrow-right"></i>';
        }
    }
}

// Riska līmeņa izvēle
function selectRiskLevel(level) {
    // Noņemt izvēli no visiem
    document.querySelectorAll('.risk-level').forEach(el => {
        el.classList.remove('selected');
    });

    // Pievienot izvēli pašreizējam
    event.currentTarget.classList.add('selected');
    
    // Iestatīt slēpto lauku
    document.getElementById('aiActRiskLevel').value = level;
}

// Risku faktoru matricas renderēšana
function renderRiskFactorsMatrix() {
    const container = document.getElementById('riskFactorsMatrix');
    
    if (!riskFactors || riskFactors.length === 0) {
        container.innerHTML = '<p>Nav ielādēti risku faktori</p>';
        return;
    }

    const html = riskFactors.map(factor => `
        <div class="risk-factor" data-factor-id="${factor.id}">
            <div class="risk-factor-header">
                <div class="risk-factor-title" onclick="showRiskExplanation('${factor.factorCode}')">
                    <i class="fas fa-info-circle"></i>
                    ${factor.factorName}
                </div>
            </div>
            
            <div class="risk-matrix">
                <div class="matrix-section">
                    <label>Varbūtības līmenis:</label>
                    <div class="matrix-options">
                        <div class="matrix-option" data-type="probability" data-value="VERY_LOW" onclick="selectMatrixOption(this)">Ļoti zems</div>
                        <div class="matrix-option" data-type="probability" data-value="LOW" onclick="selectMatrixOption(this)">Zems</div>
                        <div class="matrix-option" data-type="probability" data-value="MEDIUM" onclick="selectMatrixOption(this)">Vidējs</div>
                        <div class="matrix-option" data-type="probability" data-value="HIGH" onclick="selectMatrixOption(this)">Augsts</div>
                        <div class="matrix-option" data-type="probability" data-value="VERY_HIGH" onclick="selectMatrixOption(this)">Ļoti augsts</div>
                    </div>
                </div>
                
                <div class="matrix-section">
                    <label>Ietekmes līmenis:</label>
                    <div class="matrix-options">
                        <div class="matrix-option" data-type="impact" data-value="VERY_LOW" onclick="selectMatrixOption(this)">Ļoti zema</div>
                        <div class="matrix-option" data-type="impact" data-value="LOW" onclick="selectMatrixOption(this)">Zema</div>
                        <div class="matrix-option" data-type="impact" data-value="MEDIUM" onclick="selectMatrixOption(this)">Vidēja</div>
                        <div class="matrix-option" data-type="impact" data-value="HIGH" onclick="selectMatrixOption(this)">Augsta</div>
                        <div class="matrix-option" data-type="impact" data-value="VERY_HIGH" onclick="selectMatrixOption(this)">Ļoti augsta</div>
                    </div>
                </div>
                
                <div class="risk-result" id="risk-result-${factor.id}">
                    Izvēlieties varbūtību un ietekmi
                </div>
            </div>

            <div class="form-group">
                <label>Kontroles pasākumi:</label>
                <textarea name="controlMeasures_${factor.id}" rows="2" 
                    placeholder="Aprakstiet pašreizējos vai plānotos kontroles pasākumus..."></textarea>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

// Matricas opcijas izvēle
function selectMatrixOption(element) {
    const type = element.getAttribute('data-type');
    const value = element.getAttribute('data-value');
    const riskFactor = element.closest('.risk-factor');
    const factorId = riskFactor.getAttribute('data-factor-id');

    // Noņemt izvēli no citām opcijām šajā kategorijā
    const siblingOptions = riskFactor.querySelectorAll(`[data-type="${type}"]`);
    siblingOptions.forEach(option => option.classList.remove('selected'));

    // Pievienot izvēli pašreizējai opcijai
    element.classList.add('selected');

    // Saglabāt vērtību
    riskFactor.setAttribute(`data-${type}`, value);

    // Aprēķināt un parādīt risku
    calculateAndDisplayRisk(riskFactor, factorId);
}

// Riska aprēķināšana un parādīšana
function calculateAndDisplayRisk(riskFactor, factorId) {
    const probability = riskFactor.getAttribute('data-probability');
    const impact = riskFactor.getAttribute('data-impact');
    
    if (!probability || !impact) {
        return;
    }

    const riskLevel = calculateRiskLevel(probability, impact);
    const resultElement = document.getElementById(`risk-result-${factorId}`);
    
    if (resultElement) {
        resultElement.className = `risk-result ${riskLevel.toLowerCase().replace('_', '-')}`;
        resultElement.textContent = `Riska līmenis: ${formatRiskLevel(riskLevel)}`;
    }
}

// Riska līmeņa aprēķināšana
function calculateRiskLevel(probability, impact) {
    const riskValues = {
        'VERY_LOW': 1,
        'LOW': 2,
        'MEDIUM': 3,
        'HIGH': 4,
        'VERY_HIGH': 5
    };

    const probValue = riskValues[probability];
    const impactValue = riskValues[impact];
    const riskScore = probValue * impactValue;

    if (riskScore <= 2) return 'VERY_LOW';
    if (riskScore <= 6) return 'LOW';
    if (riskScore <= 12) return 'MEDIUM';
    if (riskScore <= 20) return 'HIGH';
    return 'VERY_HIGH';
}

// Risku matricas validācija
function validateRiskMatrix() {
    const riskFactorElements = document.querySelectorAll('.risk-factor');
    let allValid = true;

    riskFactorElements.forEach(element => {
        const probability = element.getAttribute('data-probability');
        const impact = element.getAttribute('data-impact');
        
        if (!probability || !impact) {
            allValid = false;
            element.style.borderColor = '#e74c3c';
            
            setTimeout(() => {
                element.style.borderColor = '';
            }, 3000);
        }
    });

    return allValid;
}

// Riska skaidrojuma parādīšana
function showRiskExplanation(factorCode) {
    const factor = riskFactors.find(f => f.factorCode === factorCode);
    
    if (!factor) return;

    document.getElementById('riskExplanationTitle').textContent = factor.factorName;
    document.getElementById('riskExplanationContent').innerHTML = `
        <p><strong>Apraksts:</strong> ${factor.description}</p>
        <div style="margin-top: 1rem;">
            <strong>Detalizēts skaidrojums:</strong>
            <p style="margin-top: 0.5rem; line-height: 1.6;">${factor.explanation}</p>
        </div>
    `;
    
    showModal('riskExplanationModal');
}

// Riska mazināšanas pasākumu ģenerēšana
function generateMitigationActions() {
    const container = document.getElementById('mitigationActions');
    const riskFactorElements = document.querySelectorAll('.risk-factor');
    
    let html = '';
    
    riskFactorElements.forEach(element => {
        const factorId = element.getAttribute('data-factor-id');
        const probability = element.getAttribute('data-probability');
        const impact = element.getAttribute('data-impact');
        
        if (probability && impact) {
            const riskLevel = calculateRiskLevel(probability, impact);
            const factor = riskFactors.find(f => f.id == factorId);
            
            if (riskLevel === 'HIGH' || riskLevel === 'VERY_HIGH') {
                html += `
                    <div class="mitigation-action" data-factor-id="${factorId}">
                        <h4>${factor.factorName} - <span class="risk-result ${riskLevel.toLowerCase().replace('_', '-')}">${formatRiskLevel(riskLevel)}</span></h4>
                        <div class="form-group">
                            <label>Riska mazināšanas pasākums:</label>
                            <textarea name="mitigation_${factorId}" rows="2" required
                                placeholder="Aprakstiet konkrētu pasākumu šī riska mazināšanai..."></textarea>
                        </div>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Atbildīgā persona:</label>
                                <input type="text" name="responsible_${factorId}" required>
                            </div>
                            <div class="form-group">
                                <label>Termiņš:</label>
                                <input type="date" name="deadline_${factorId}" required>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    });
    
    if (!html) {
        html = '<p class="info-message">Nav identificēti augsta riska faktori, kas prasītu īpašus mazināšanas pasākumus.</p>';
    }
    
    container.innerHTML = html;
}

// Papildu mazināšanas pasākuma pievienošana
function addMitigationAction() {
    const container = document.getElementById('mitigationActions');
    const actionHtml = `
        <div class="mitigation-action custom">
            <h4>Papildu pasākums</h4>
            <div class="form-group">
                <label>Pasākuma apraksts:</label>
                <textarea name="custom_mitigation" rows="2" required
                    placeholder="Aprakstiet papildu riska mazināšanas pasākumu..."></textarea>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Atbildīgā persona:</label>
                    <input type="text" name="custom_responsible" required>
                </div>
                <div class="form-group">
                    <label>Termiņš:</label>
                    <input type="date" name="custom_deadline" required>
                </div>
            </div>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeMitigationAction(this)">
                <i class="fas fa-trash"></i> Noņemt
            </button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', actionHtml);
}

// Mazināšanas pasākuma noņemšana
function removeMitigationAction(button) {
    const action = button.closest('.mitigation-action');
    if (action && action.classList.contains('custom')) {
        action.remove();
    }
}

// MI rīka izvēles saraksta aizpildīšana
function populateToolSelect(tools) {
    const select = document.getElementById('aiToolSelect');
    if (!select) return;

    // Notīrīt pašreizējās opcijas (izņemot pirmo)
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }

    // Pievienot MI rīkus
    tools.forEach(tool => {
        const option = document.createElement('option');
        option.value = tool.id;
        option.textContent = `${tool.toolName} (${tool.developer || 'Nav norādīts'})`;
        select.appendChild(option);
    });
}

// Vērtējuma formas iesniegšana
async function handleAssessmentSubmit(event) {
    event.preventDefault();
    
    if (!validateCurrentStep()) {
        return;
    }

    showLoading(true);

    try {
        const formData = collectFormData();
        const response = await fetchAPI(API_ENDPOINTS.assessments, 'POST', formData);
        
        if (response.success) {
            showNotification('Vērtējums veiksmīgi saglabāts!', 'success');
            closeModal('assessmentModal');
            loadAssessmentsData(); // Atjaunināt tabulu
        } else {
            throw new Error(response.message || 'Nezināma kļūda');
        }
    } catch (error) {
        console.error('Kļūda saglabājot vērtējumu:', error);
        showNotification('Kļūda saglabājot vērtējumu: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Formas datu savākšana
function collectFormData() {
    const form = document.getElementById('riskAssessmentForm');
    const formData = new FormData(form);
    
    const data = {
        aiToolId: formData.get('aiToolId'),
        assessmentVersion: formData.get('assessmentVersion'),
        problemSolved: formData.get('problemSolved'),
        usersDescription: formData.get('usersDescription'),
        decisionsAffected: formData.get('decisionsAffected'),
        potentialImpact: formData.get('potentialImpact'),
        resultsUsage: formData.get('resultsUsage'),
        usesRestrictedData: formData.get('usesRestrictedData') === 'true',
        restrictedDataExplanation: formData.get('restrictedDataExplanation'),
        aiActRiskLevel: formData.get('aiActRiskLevel'),
        riskAssessmentDetails: [],
        mitigationActions: []
    };

    // Savākt risku faktoru vērtējumus
    const riskFactorElements = document.querySelectorAll('.risk-factor');
    riskFactorElements.forEach(element => {
        const factorId = element.getAttribute('data-factor-id');
        const probability = element.getAttribute('data-probability');
        const impact = element.getAttribute('data-impact');
        const controlMeasures = element.querySelector(`textarea[name="controlMeasures_${factorId}"]`).value;

        if (probability && impact) {
            data.riskAssessmentDetails.push({
                riskFactorId: factorId,
                probabilityLevel: probability,
                impactLevel: impact,
                controlMeasures: controlMeasures
            });
        }
    });

    // Savākt mazināšanas pasākumus
    const mitigationElements = document.querySelectorAll('.mitigation-action');
    mitigationElements.forEach(element => {
        const factorId = element.getAttribute('data-factor-id');
        const isCustom = element.classList.contains('custom');
        
        if (isCustom) {
            const description = element.querySelector('textarea[name="custom_mitigation"]').value;
            const responsible = element.querySelector('input[name="custom_responsible"]').value;
            const deadline = element.querySelector('input[name="custom_deadline"]').value;
            
            if (description && responsible && deadline) {
                data.mitigationActions.push({
                    actionDescription: description,
                    responsiblePerson: responsible,
                    targetDate: deadline,
                    riskFactorId: null // Custom action
                });
            }
        } else if (factorId) {
            const description = element.querySelector(`textarea[name="mitigation_${factorId}"]`).value;
            const responsible = element.querySelector(`input[name="responsible_${factorId}"]`).value;
            const deadline = element.querySelector(`input[name="deadline_${factorId}"]`).value;
            
            if (description && responsible && deadline) {
                data.mitigationActions.push({
                    actionDescription: description,
                    responsiblePerson: responsible,
                    targetDate: deadline,
                    riskFactorId: factorId
                });
            }
        }
    });

    return data;
}

// MI rīka pievienošanas formas iesniegšana
async function handleAddToolSubmit(event) {
    event.preventDefault();
    
    showLoading(true);

    try {
        const formData = new FormData(event.target);
        const data = {
            toolName: formData.get('toolName'),
            developer: formData.get('developer'),
            functionality: formData.get('functionality'),
            responsibleUnit: formData.get('responsibleUnit'),
            implementationDate: formData.get('implementationDate')
        };

        const response = await fetchAPI(API_ENDPOINTS.tools, 'POST', data);
        
        if (response.success) {
            showNotification('MI rīks veiksmīgi pievienots!', 'success');
            closeModal('addToolModal');
            loadToolsData(); // Atjaunināt rīku sarakstu
        } else {
            throw new Error(response.message || 'Nezināma kļūda');
        }
    } catch (error) {
        console.error('Kļūda pievienojot MI rīku:', error);
        showNotification('Kļūda pievienojot MI rīku: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// API izsaukumi
async function fetchAPI(endpoint, method = 'GET', data = null) {
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    // Pievienot autentifikācijas token, ja ir
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(API_BASE_URL + endpoint, config);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

// Ielādes indikatora parādīšana/paslēpšana
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

// Paziņojumu sistēma
function showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    notification.innerHTML = `
        <div class="notification-header">
            <span class="notification-title">
                <i class="${iconMap[type]}"></i>
                ${type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
            <span class="notification-close" onclick="removeNotification(this)">×</span>
        </div>
        <div class="notification-message">${message}</div>
    `;

    container.appendChild(notification);

    // Automātiski noņemt pēc noteikta laika
    setTimeout(() => {
        removeNotification(notification.querySelector('.notification-close'));
    }, duration);
}

// Paziņojuma noņemšana
function removeNotification(closeButton) {
    const notification = closeButton.closest('.notification');
    if (notification) {
        notification.style.animation = 'notificationSlideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
}

// Formātu palīgfuncijas
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('lv-LV', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function formatRiskLevel(level) {
    const levelMap = {
        'PROHIBITED': 'Aizliegta',
        'HIGH_RISK': 'Augsts risks',
        'LIMITED_RISK': 'Ierobežots risks',
        'MINIMAL_RISK': 'Minimāls risks',
        'VERY_LOW': 'Ļoti zems',
        'LOW': 'Zems',
        'MEDIUM': 'Vidējs',
        'HIGH': 'Augsts',
        'VERY_HIGH': 'Ļoti augsts'
    };
    return levelMap[level] || level;
}

function formatStatus(status) {
    const statusMap = {
        'DRAFT': 'Melnraksts',
        'IN_PROGRESS': 'Procesā',
        'COMPLETED': 'Pabeigts',
        'APPROVED': 'Apstiprināts',
        'REJECTED': 'Noraidīts',
        'IN_REVIEW': 'Pārskatīšanā'
    };
    return statusMap[status] || status;
}

// Lietotāja sesijas pārbaude
function checkUserSession() {
    const token = localStorage.getItem('authToken');
    const userInfo = localStorage.getItem('userInfo');
    
    if (token && userInfo) {
        currentUser = JSON.parse(userInfo);
        updateUserDisplay();
    } else {
        // Pāradresēt uz pieteikšanās lapu
        // window.location.href = '/login.html';
    }
}

// Lietotāja displeja atjaunināšana
function updateUserDisplay() {
    const userDisplayName = document.getElementById('userDisplayName');
    if (userDisplayName && currentUser) {
        userDisplayName.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    }
}

// Izrakstīšanās
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    currentUser = null;
    // window.location.href = '/login.html';
    showNotification('Jūs esat veiksmīgi izrakstījušies', 'info');
}

// Auto-save iestatīšana
function setupAutoSave() {
    let autoSaveInterval;
    
    function startAutoSave() {
        autoSaveInterval = setInterval(() => {
            const assessmentForm = document.getElementById('riskAssessmentForm');
            if (assessmentForm && assessmentForm.checkValidity()) {
                saveFormProgress();
            }
        }, 30000); // Katras 30 sekundes
    }
    
    function stopAutoSave() {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
        }
    }
    
    // Sākt auto-save, kad atvērts vērtējuma modālis
    document.addEventListener('modalOpened', (e) => {
        if (e.detail === 'assessmentModal') {
            startAutoSave();
        }
    });
    
    // Apturēt auto-save, kad aizvērts modālis
    document.addEventListener('modalClosed', (e) => {
        if (e.detail === 'assessmentModal') {
            stopAutoSave();
        }
    });
}

// Formas progresa saglabāšana
function saveFormProgress() {
    try {
        const formData = collectFormData();
        localStorage.setItem('assessmentFormProgress', JSON.stringify(formData));
        console.log('Formas progress saglabāts');
    } catch (error) {
        console.error('Kļūda saglabājot formas progresu:', error);
    }
}

// Formas progresa ielāde
function loadFormProgress() {
    try {
        const savedProgress = localStorage.getItem('assessmentFormProgress');
        if (savedProgress) {
            const data = JSON.parse(savedProgress);
            // Ielādēt datus formā
            // Šeit varētu būt implementēta logika datu ielādei
            showNotification('Ielādēts saglabātais progress', 'info');
        }
    } catch (error) {
        console.error('Kļūda ielādējot formas progresu:', error);
    }
}

// Klaviatūras saīsņu apstrāde
function handleKeyboardShortcuts(event) {
    // Ctrl+S - saglabāt
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        saveFormProgress();
        showNotification('Progress saglabāts', 'success', 2000);
    }
    
    // Escape - aizvērt modāļus
    if (event.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal[style*="block"]');
        openModals.forEach(modal => {
            closeModal(modal.id);
        });
    }
    
    // Arrow keys formas navigācijai
    if (document.querySelector('.modal[style*="block"]')) {
        if (event.key === 'ArrowRight' && event.ctrlKey) {
            event.preventDefault();
            changeStep(1);
        }
        if (event.key === 'ArrowLeft' && event.ctrlKey) {
            event.preventDefault();
            changeStep(-1);
        }
    }
}

// Diagrammu inicializācija
function initializeCharts() {
    // Risku sadalījuma diagramma
    const riskCtx = document.getElementById('riskDistributionChart');
    if (riskCtx) {
        new Chart(riskCtx, {
            type: 'doughnut',
            data: {
                labels: ['Minimāls risks', 'Ierobežots risks', 'Augsts risks', 'Aizliegta'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        '#27ae60',
                        '#3498db',
                        '#f39c12',
                        '#e74c3c'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Risku sadalījuma diagrammas atjaunināšana
function updateRiskDistributionChart(data) {
    const canvas = document.getElementById('riskDistributionChart');
    if (canvas && canvas.chart) {
        canvas.chart.data.datasets[0].data = [
            data.minimalRisk || 0,
            data.limitedRisk || 0,
            data.highRisk || 0,
            data.prohibited || 0
        ];
        canvas.chart.update();
    }
}

// Atskaišu ģenerēšana
async function generateReport(reportType) {
    showLoading(true);
    
    try {
        const response = await fetchAPI(`${API_ENDPOINTS.reports}/${reportType}`, 'POST');
        
        if (response.success) {
            // Lejupielādēt atskaiti
            const link = document.createElement('a');
            link.href = response.downloadUrl;
            link.download = response.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('Atskaite veiksmīgi ģenerēta!', 'success');
        } else {
            throw new Error(response.message || 'Nezināma kļūda');
        }
    } catch (error) {
        console.error('Kļūda ģenerējot atskaiti:', error);
        showNotification('Kļūda ģenerējot atskaiti: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// MI rīka rediģēšana
function editTool(toolId) {
    const tool = aiTools.find(t => t.id === toolId);
    if (!tool) {
        showNotification('MI rīks nav atrasts', 'error');
        return;
    }
    
    // Aizpildīt formu ar esošajiem datiem
    document.getElementById('toolName').value = tool.toolName;
    document.getElementById('developer').value = tool.developer || '';
    document.getElementById('functionality').value = tool.functionality;
    document.getElementById('responsibleUnit').value = tool.responsibleUnit || '';
    document.getElementById('implementationDate').value = tool.implementationDate || '';
    
    // Mainīt formas nosaukumu un pogu
    document.querySelector('#addToolModal .modal-header h2').innerHTML = '<i class="fas fa-edit"></i> Rediģēt MI rīku';
    document.querySelector('#addToolForm button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Atjaunināt';
    
    // Saglabāt rediģēšanas ID
    document.getElementById('addToolForm').setAttribute('data-edit-id', toolId);
    
    showModal('addToolModal');
}

// MI rīka dzēšana
async function deleteTool(toolId) {
    if (!confirm('Vai tiešām vēlaties dzēst šo MI rīku? Šī darbība ir neatgriezeniska.')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetchAPI(`${API_ENDPOINTS.tools}/${toolId}`, 'DELETE');
        
        if (response.success) {
            showNotification('MI rīks veiksmīgi dzēsts!', 'success');
            loadToolsData(); // Atjaunināt sarakstu
        } else {
            throw new Error(response.message || 'Nezināma kļūda');
        }
    } catch (error) {
        console.error('Kļūda dzēšot MI rīku:', error);
        showNotification('Kļūda dzēšot MI rīku: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Vērtējuma skatīšana
function viewAssessment(assessmentId) {
    // Implementēt vērtējuma skatīšanas loģiku
    showNotification('Vērtējuma skatīšana būs pieejama drīzumā', 'info');
}

// Vērtējuma rediģēšana
function editAssessment(assessmentId) {
    // Implementēt vērtējuma rediģēšanas loģiku
    showNotification('Vērtējuma rediģēšana būs pieejama drīzumā', 'info');
}

// Vērtējuma eksportēšana
async function exportAssessment(assessmentId) {
    showLoading(true);
    
    try {
        const response = await fetchAPI(`${API_ENDPOINTS.assessments}/${assessmentId}/export`, 'POST');
        
        if (response.success) {
            // Lejupielādēt failu
            const link = document.createElement('a');
            link.href = response.downloadUrl;
            link.download = response.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('Vērtējums veiksmīgi eksportēts!', 'success');
        } else {
            throw new Error(response.message || 'Nezināma kļūda');
        }
    } catch (error) {
        console.error('Kļūda eksportējot vērtējumu:', error);
        showNotification('Kļūda eksportējot vērtējumu: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Navigācijas klikšķa apstrāde
function handleNavClick(event) {
    event.preventDefault();
    
    const section = event.currentTarget.getAttribute('data-section');
    if (section) {
        showSection(section);
        
        // Atjaunināt URL (neobligāti)
        history.pushState(null, null, `#${section}`);
    }
}

// Ielādēt atskaišu datus (placeholder)
async function loadReportsData() {
    // Šeit būtu atskaišu datu ielādes loģika
    console.log('Ielādē atskaišu datus...');
}

// Eksportēt visus datus
function exportAllData() {
    showNotification('Datu eksportēšana uzsākta...', 'info');
    
    // Simulēt eksportēšanu
    setTimeout(() => {
        showNotification('Visi dati veiksmīgi eksportēti!', 'success');
    }, 2000);
}

// Importēt datus
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    console.log('Importējamie dati:', data);
                    showNotification('Dati veiksmīgi importēti!', 'success');
                } catch (error) {
                    showNotification('Kļūda importējot datus: ' + error.message, 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

// Inicializācijas notikuma izlaišana
document.addEventListener('DOMContentLoaded', function() {
    console.log('MI Risku Vērtēšanas Sistēma ielādēta');
    
    // Simulēt datu ielādi attīstības vajadzībām
    setTimeout(() => {
        // Simulēt dashboard statistiku
        updateDashboardStats({
            highRiskCount: 3,
            pendingAssessments: 7,
            completedAssessments: 15,
            totalTools: 25
        });
        
        // Simulēt pēdējos vērtējumus
        updateRecentAssessments([
            {
                toolName: 'Dokumentu klasifikators',
                riskLevel: 'HIGH_RISK',
                createdAt: new Date().toISOString()
            },
            {
                toolName: 'Čatbots atbalstam',
                riskLevel: 'LIMITED_RISK',
                createdAt: new Date(Date.now() - 86400000).toISOString()
            }
        ]);
    }, 1000);
});// MI Risku Vērtēšanas Sistēmas JavaScript

// Globālie mainīgie
let currentUser = null;
let currentStep = 1;
let totalSteps = 5;
let currentAssessment = null;
let riskFactors = [];
let aiTools = [];
let assessments = [];

// API konfigurācija
const API_BASE_URL = '/api/v1';
const API_ENDPOINTS = {
    users: '/users',
    tools: '/ai-tools',
    assessments: '/risk-assessments',
    riskFactors: '/risk-factors',
    reports: '/reports',
    auth: '/auth'
};

// Inicializācija
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadInitialData();
});

// Aplikācijas inicializācija
function initializeApp() {
    // Pārbaudīt lietotāja sesiju
    checkUserSession();
    
    // Iestatīt navigāciju
    setupNavigation();
    
    // Ielādēt sākuma lapu
    showSection('dashboard');
    
    //
