package lv.gov.airassessment.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

// ========== ORGANIZATION ENTITY ==========
@Entity
@Table(name = "organizations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Organization {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Organizācijas nosaukums ir obligāts")
    @Size(max = 255, message = "Nosaukums nedrīkst pārsniegt 255 simbolus")
    @Column(nullable = false)
    private String name;
    
    @Size(max = 50, message = "Kods nedrīkst pārsniegt 50 simbolus")
    @Column(unique = true)
    private String code;
    
    @Email(message = "Nederīgs e-pasta formāts")
    @Column(name = "contact_email")
    private String contactEmail;
    
    @Column(columnDefinition = "TEXT")
    private String address;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Saites
    @OneToMany(mappedBy = "organization", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<User> users;
    
    @OneToMany(mappedBy = "organization", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AiTool> aiTools;
}

// ========== USER ENTITY ==========
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;
    
    @NotBlank(message = "Lietotājvārds ir obligāts")
    @Size(max = 100, message = "Lietotājvārds nedrīkst pārsniegt 100 simbolus")
    @Column(unique = true, nullable = false)
    private String username;
    
    @NotBlank(message = "E-pasts ir obligāts")
    @Email(message = "Nederīgs e-pasta formāts")
    @Size(max = 255, message = "E-pasts nedrīkst pārsniegt 255 simbolus")
    @Column(unique = true, nullable = false)
    private String email;
    
    @NotBlank(message = "Parole ir obligāta")
    @Size(max = 255, message = "Paroles hash nedrīkst pārsniegt 255 simbolus")
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    
    @Size(max = 100, message = "Vārds nedrīkst pārsniegt 100 simbolus")
    @Column(name = "first_name")
    private String firstName;
    
    @Size(max = 100, message = "Uzvārds nedrīkst pārsniegt 100 simbolus")
    @Column(name = "last_name")
    private String lastName;
    
    @Enumerated(EnumType.STRING)
    @
