-- MI Risku Vērtēšanas Sistēmas Datubāzes Shēma
-- Izveidots: 2025

-- 1. Organizāciju tabula
CREATE TABLE organizations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    contact_email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Lietotāju tabula
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    organization_id BIGINT,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role ENUM('ADMIN', 'ASSESSOR', 'REVIEWER', 'VIEWER') DEFAULT 'ASSESSOR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- 3. MI rīku tabula
CREATE TABLE ai_tools (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    organization_id BIGINT NOT NULL,
    tool_name VARCHAR(255) NOT NULL,
    developer VARCHAR(255),
    functionality TEXT,
    responsible_unit VARCHAR(255),
    implementation_date DATE,
    status ENUM('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED') DEFAULT 'DRAFT',
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 4. Risku vērtējumu tabula
CREATE TABLE risk_assessments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ai_tool_id BIGINT NOT NULL,
    assessor_id BIGINT NOT NULL,
    assessment_version VARCHAR(20) DEFAULT '1.0',
    
    -- Konteksta informācija
    problem_solved TEXT,
    users_description TEXT,
    decisions_affected TEXT,
    potential_impact TEXT,
    results_usage TEXT,
    
    -- Datu ierobežojumu pārbaude
    uses_restricted_data BOOLEAN DEFAULT FALSE,
    restricted_data_explanation TEXT,
    
    -- MI akta riska līmenis
    ai_act_risk_level ENUM('PROHIBITED', 'HIGH_RISK', 'LIMITED_RISK', 'MINIMAL_RISK'),
    
    -- Kopējais statuss
    overall_status ENUM('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED') DEFAULT 'DRAFT',
    reviewer_comments TEXT,
    approved_by BIGINT,
    approved_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ai_tool_id) REFERENCES ai_tools(id) ON DELETE CASCADE,
    FOREIGN KEY (assessor_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- 5. Risku faktoru definīcijas
CREATE TABLE risk_factors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    factor_code VARCHAR(50) UNIQUE NOT NULL,
    factor_name VARCHAR(255) NOT NULL,
    description TEXT,
    explanation TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0
);

-- 6. Risku vērtējumu detaļas
CREATE TABLE risk_assessments_details (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    risk_assessment_id BIGINT NOT NULL,
    risk_factor_id BIGINT NOT NULL,
    probability_level ENUM('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'),
    impact_level ENUM('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'),
    risk_level ENUM('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'),
    control_measures TEXT,
    responsible_person VARCHAR(255),
    mitigation_deadline DATE,
    notes TEXT,
    
    FOREIGN KEY (risk_assessment_id) REFERENCES risk_assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (risk_factor_id) REFERENCES risk_factors(id),
    UNIQUE KEY unique_assessment_factor (risk_assessment_id, risk_factor_id)
);

-- 7. Riska mazināšanas pasākumi
CREATE TABLE mitigation_actions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    risk_assessment_detail_id BIGINT NOT NULL,
    action_description TEXT NOT NULL,
    responsible_person VARCHAR(255),
    target_date DATE,
    completion_date DATE,
    status ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PLANNED',
    progress_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (risk_assessment_detail_id) REFERENCES risk_assessments_details(id) ON DELETE CASCADE
);

-- 8. MI akta kategorijas
CREATE TABLE ai_act_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_code VARCHAR(50) UNIQUE NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    risk_level ENUM('PROHIBITED', 'HIGH_RISK', 'LIMITED_RISK', 'MINIMAL_RISK'),
    examples TEXT
);

-- 9. MI rīku kategoriju saites
CREATE TABLE ai_tool_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ai_tool_id BIGINT NOT NULL,
    ai_act_category_id BIGINT NOT NULL,
    
    FOREIGN KEY (ai_tool_id) REFERENCES ai_tools(id) ON DELETE CASCADE,
    FOREIGN KEY (ai_act_category_id) REFERENCES ai_act_categories(id),
    UNIQUE KEY unique_tool_category (ai_tool_id, ai_act_category_id)
);

-- 10. Dokumentu tabula
CREATE TABLE assessment_documents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    risk_assessment_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    document_type ENUM('TECHNICAL_SPEC', 'RISK_ANALYSIS', 'MITIGATION_PLAN', 'APPROVAL_FORM', 'OTHER'),
    uploaded_by BIGINT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (risk_assessment_id) REFERENCES risk_assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- 11. Sistēmas konfigurācijas
CREATE TABLE system_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    updated_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Indeksi optimizācijai
CREATE INDEX idx_ai_tools_organization ON ai_tools(organization_id);
CREATE INDEX idx_ai_tools_status ON ai_tools(status);
CREATE INDEX idx_risk_assessments_tool ON risk_assessments(ai_tool_id);
CREATE INDEX idx_risk_assessments_status ON risk_assessments(overall_status);
CREATE INDEX idx_risk_assessments_details_assessment ON risk_assessments_details(risk_assessment_id);
CREATE INDEX idx_mitigation_actions_detail ON mitigation_actions(risk_assessment_detail_id);
CREATE INDEX idx_mitigation_actions_status ON mitigation_actions(status);

-- Sākuma datu ievietošana

-- Risku faktori
INSERT INTO risk_factors (factor_code, factor_name, description, explanation, sort_order) VALUES
('MODEL_BIAS', 'Modeļa aizspriedumi', 'MI sistēma var izdarīt netaisnīgus lēmumus', 'MI sistēma var izdarīt netaisnīgus lēmumus, jo tā mācījusies no datiem, kuros jau ir aizspriedumi. Piemērs: ja sistēma darba atlasē dod priekšroku vienai dzimuma vai etniskajai grupai, jo dati bija neobjektīvi.', 1),
('DATA_PRIVACY', 'Datu privātuma pārkāpumi', 'MI var izmantot personas datus bez pietiekamas aizsardzības', 'MI var izmantot vai saglabāt personas datus bez pietiekamas aizsardzības. Piemērs: sistēma atceras jūsu personisko informāciju pat tad, kad tam nevajadzētu.', 2),
('MODEL_OPACITY', 'Modeļa necaurspīdīgums', 'Nav skaidrs, kāpēc MI pieņēma konkrētu lēmumu', 'Nav skaidrs, kāpēc MI pieņēma konkrētu lēmumu. Piemērs: MI noraida kredīta pieteikumu, bet nevar paskaidrot, kāpēc.', 3),
('AUTOMATION_ERRORS', 'Automatizācijas kļūdas', 'MI var pieļaut kļūdas bez cilvēka uzraudzības', 'MI var pieļaut kļūdas, ja tas darbojas bez cilvēka uzraudzības. Piemērs: robots nosūta nepareizu rēķinu, jo netika pārbaudīts gala rezultāts.', 4),
('REGULATORY_COMPLIANCE', 'Neatbilstība normatīvajiem aktiem', 'MI var pārkāpt likumus par datu aizsardzību', 'MI var darboties tā, ka tiek pārkāpti likumi par datu aizsardzību vai diskrimināciju. Piemērs: lietotāja dati tiek izmantoti bez viņa piekrišanas, kas pārkāpj GDPR.', 5),
('VENDOR_SECURITY', 'MI piegādātāja drošības ievainojamības', 'MI sistēmu var uzlauzt un izmantot ļaunprātīgi', 'MI sistēmu var uzlauzt un izmantot ļaunprātīgi. Piemērs: uzbrucējs piekļūst MI rīkam un maina tā lēmumus vai nozog datus.', 6),
('SOCIAL_TRUST', 'Sociālās uzticēšanās samazināšanās', 'Cilvēki var pārstāt uzticēties MI', 'Cilvēki var pārstāt uzticēties MI, ja tas izturas netaisnīgi vai necaurspīdīgi. Piemērs: ja cilvēki jūt, ka MI viņus "vērtē" bez skaidrības vai iespējas iebilst.', 7);

-- MI akta kategorijas
INSERT INTO ai_act_categories (category_code, category_name, description, risk_level, examples) VALUES
('PROHIBITED', 'Aizliegtas MI sistēmas', 'Sistēmas, kas apdraud cilvēku tiesības, izmanto manipulāciju vai sociālo kontroli', 'PROHIBITED', 'Sociālās punktu sistēmas, emociju atpazīšana sociālajam novērtējumam, zemapziņas manipulācija, biometrijas identificēšana reāllaikā bez uzraudzības'),
('HIGH_RISK', 'Augsta riska MI', 'Sistēmas, kas ietekmē būtiskas jomas, piemēram, veselību, izglītību vai nodarbinātību', 'HIGH_RISK', 'CV atlase darba intervijām, MI izmantošana tiesvedībā, kredītspējas novērtējums, medicīniskās diagnostikas MI'),
('LIMITED_RISK', 'Ierobežoti riski', 'Sistēmas, kuras lietotāji apzinās kā MI un kur nepieciešama informācijas caurspīdība', 'LIMITED_RISK', 'Čatboti, attēlu vai video ģenerēšana, emociju atpazīšana reklāmās'),
('MINIMAL_RISK', 'Zema riska (minimāls)', 'Sistēmas ar nelielu vai nekādu ietekmi uz cilvēku tiesībām', 'MINIMAL_RISK', 'MI filtri pastā vai e-komercijā, rekomendācijas sistēmas (Netflix, Spotify), viedās mājas ierīces');

-- Sistēmas konfigurācija
INSERT INTO system_config (config_key, config_value, description) VALUES
('SYSTEM_VERSION', '1.0.0', 'Sistēmas versija'),
('MAX_FILE_SIZE', '10485760', 'Maksimālais faila izmērs baitos (10MB)'),
('SUPPORTED_FILE_TYPES', 'pdf,doc,docx,xls,xlsx,txt', 'Atļautie failu tipi'),
('AUTO_SAVE_INTERVAL', '30', 'Auto-saglabāšanas intervāls sekundēs'),
('SESSION_TIMEOUT', '3600', 'Sesijas taimauts sekundēs'),
('EMAIL_NOTIFICATIONS', 'true', 'Vai ieslēgt e-pasta paziņojumus'),
('BACKUP_RETENTION_DAYS', '365', 'Rezerves kopiju glabāšanas dienas');

-- Skatījumi (Views) ērtākai datu piekļuvei

-- Pilns risku vērtējuma skats
CREATE VIEW vw_risk_assessment_full AS
SELECT 
    ra.id as assessment_id,
    ra.assessment_version,
    at.tool_name,
    at.developer,
    org.name as organization_name,
    u_assessor.first_name as assessor_first_name,
    u_assessor.last_name as assessor_last_name,
    u_reviewer.first_name as reviewer_first_name,
    u_reviewer.last_name as reviewer_last_name,
    ra.problem_solved,
    ra.ai_act_risk_level,
    ra.overall_status,
    ra.created_at,
    ra.updated_at,
    ra.approved_at
FROM risk_assessments ra
JOIN ai_tools at ON ra.ai_tool_id = at.id
JOIN organizations org ON at.organization_id = org.id
JOIN users u_assessor ON ra.assessor_id = u_assessor.id
LEFT JOIN users u_reviewer ON ra.approved_by = u_reviewer.id;

-- Risku faktoru kopsavilkuma skats
CREATE VIEW vw_risk_summary AS
SELECT 
    ra.id as assessment_id,
    at.tool_name,
    COUNT(rad.id) as total_risks,
    SUM(CASE WHEN rad.risk_level = 'VERY_HIGH' THEN 1 ELSE 0 END) as very_high_risks,
    SUM(CASE WHEN rad.risk_level = 'HIGH' THEN 1 ELSE 0 END) as high_risks,
    SUM(CASE WHEN rad.risk_level = 'MEDIUM' THEN 1 ELSE 0 END) as medium_risks,
    SUM(CASE WHEN rad.risk_level = 'LOW' THEN 1 ELSE 0 END) as low_risks,
    SUM(CASE WHEN rad.risk_level = 'VERY_LOW' THEN 1 ELSE 0 END) as very_low_risks
FROM risk_assessments ra
JOIN ai_tools at ON ra.ai_tool_id = at.id
LEFT JOIN risk_assessments_details rad ON ra.id = rad.risk_assessment_id
GROUP BY ra.id, at.tool_name;

-- Mitigation actions progress view
CREATE VIEW vw_mitigation_progress AS
SELECT 
    ra.id as assessment_id,
    at.tool_name,
    COUNT(ma.id) as total_actions,
    SUM(CASE WHEN ma.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_actions,
    SUM(CASE WHEN ma.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_actions,
    SUM(CASE WHEN ma.status = 'PLANNED' THEN 1 ELSE 0 END) as planned_actions,
    ROUND((SUM(CASE WHEN ma.status = 'COMPLETED' THEN 1 ELSE 0 END) * 100.0 / COUNT(ma.id)), 2) as completion_percentage
FROM risk_assessments ra
JOIN ai_tools at ON ra.ai_tool_id = at.id
JOIN risk_assessments_details rad ON ra.id = rad.risk_assessment_id
LEFT JOIN mitigation_actions ma ON rad.id = ma.risk_assessment_detail_id
GROUP BY ra.id, at.tool_name;

-- Procedūra risku līmeņa aprēķināšanai
DELIMITER //
CREATE PROCEDURE CalculateRiskLevel(
    IN probability ENUM('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'),
    IN impact ENUM('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'),
    OUT risk_level ENUM('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH')
)
BEGIN
    DECLARE prob_value INT;
    DECLARE impact_value INT;
    DECLARE risk_value INT;
    
    -- Convert enums to numeric values
    CASE probability
        WHEN 'VERY_LOW' THEN SET prob_value = 1;
        WHEN 'LOW' THEN SET prob_value = 2;
        WHEN 'MEDIUM' THEN SET prob_value = 3;
        WHEN 'HIGH' THEN SET prob_value = 4;
        WHEN 'VERY_HIGH' THEN SET prob_value = 5;
    END CASE;
    
    CASE impact
        WHEN 'VERY_LOW' THEN SET impact_value = 1;
        WHEN 'LOW' THEN SET impact_value = 2;
        WHEN 'MEDIUM' THEN SET impact_value = 3;
        WHEN 'HIGH' THEN SET impact_value = 4;
        WHEN 'VERY_HIGH' THEN SET impact_value = 5;
    END CASE;
    
    -- Calculate risk (simple multiplication)
    SET risk_value = prob_value * impact_value;
    
    -- Convert back to enum
    CASE 
        WHEN risk_value <= 2 THEN SET risk_level = 'VERY_LOW';
        WHEN risk_value <= 6 THEN SET risk_level = 'LOW';
        WHEN risk_value <= 12 THEN SET risk_level = 'MEDIUM';
        WHEN risk_value <= 20 THEN SET risk_level = 'HIGH';
        ELSE SET risk_level = 'VERY_HIGH';
    END CASE;
END //
DELIMITER ;

-- Trigger risku līmeņa automātiskai aprēķināšanai
DELIMITER //
CREATE TRIGGER tr_calculate_risk_level 
BEFORE INSERT ON risk_assessments_details
FOR EACH ROW
BEGIN
    CALL CalculateRiskLevel(NEW.probability_level, NEW.impact_level, @calculated_risk);
    SET NEW.risk_level = @calculated_risk;
END //

CREATE TRIGGER tr_update_risk_level 
BEFORE UPDATE ON risk_assessments_details
FOR EACH ROW
BEGIN
    IF NEW.probability_level != OLD.probability_level OR NEW.impact_level != OLD.impact_level THEN
        CALL CalculateRiskLevel(NEW.probability_level, NEW.impact_level, @calculated_risk);
        SET NEW.risk_level = @calculated_risk;
    END IF;
END //
DELIMITER ;
