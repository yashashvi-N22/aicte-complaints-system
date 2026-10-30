from datetime import datetime, timedelta
from app.database import SessionLocal, Base, engine
from app.models.user import User, UserRole
from app.models.institution import Institution, InstituteType
from app.models.department import Department
from app.models.complaint import Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus
from app.models.complaint_history import ComplaintStatusHistory
from app.models.assignment import ComplaintAssignment
from app.models.duplicate import DuplicateSuggestion, DuplicateReviewStatus
from app.models.coordination import DepartmentCoordination
from app.models.notification import Notification
from app.models.audit import AuditLog
from app.services.auth import get_password_hash
from app.services.duplicate_detector import scan_duplicates_for_complaint

def seed_database():
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).filter(User.username == "admin").first():
            print("Database already contains seed data. Skipping re-seed.")
            return

        print("Seeding AICTE Complaint Monitoring System with realistic demonstration data...")
        
        # 1. Departments
        departments_data = [
            {
                "code": "BUREAU_APPROVAL",
                "name": "Approval & Affiliation Bureau",
                "description": "Scrutiny of Extension of Approval (EoA), new institutions, and seat matrix adjustments.",
                "contact_email": "approval.bureau@aicte-india.org"
            },
            {
                "code": "CELL_GRIEVANCE",
                "name": "Central Grievance Redressal Cell",
                "description": "General institutional grievances, public grievances, and ombudsman escalations.",
                "contact_email": "grievance.cell@aicte-india.org"
            },
            {
                "code": "BUREAU_FACULTY",
                "name": "Faculty & Staff Welfare Bureau",
                "description": "7th CPC pay scale compliance, faculty cadre ratio, service rules, and arrears monitoring.",
                "contact_email": "faculty.bureau@aicte-india.org"
            },
            {
                "code": "CELL_STUDENT_WELFARE",
                "name": "Student Affairs & Anti-Ragging Cell",
                "description": "Strict compliance with AICTE Anti-Ragging regulations, student scholarships, and fee disputes.",
                "contact_email": "antiragging.cell@aicte-india.org"
            },
            {
                "code": "BUREAU_FINANCE",
                "name": "Finance, Grants & Research Bureau",
                "description": "RPS, MODROBS, ATAL Academy grants, and institutional financial audit verifications.",
                "contact_email": "finance.bureau@aicte-india.org"
            },
            {
                "code": "BUREAU_ACADEMIC",
                "name": "Policy & Academic Planning Bureau",
                "description": "Model curriculum integration, mandatory internships, and NEP 2020 alignment.",
                "contact_email": "academic.bureau@aicte-india.org"
            }
        ]
        
        dept_objs = {}
        for d in departments_data:
            dept = Department(**d, is_active=True)
            db.add(dept)
            db.flush()
            dept_objs[d["code"]] = dept
            
        print("  -> Seeded 6 AICTE bureaus and cells.")

        # 2. Institutions
        institutions_data = [
            {
                "aicte_id": "1-109283741",
                "name": "Delhi Technological Academy",
                "code": "DTA-DEL-01",
                "institute_type": InstituteType.ENGINEERING,
                "state": "Delhi",
                "district": "New Delhi",
                "address": "Bawana Road, Shahbad Daulatpur, Rohini Sector 16",
                "pin_code": "110042",
                "contact_email": "registrar@dta-delhi.ac.in",
                "contact_phone": "011-27871018",
                "website": "https://www.dta-delhi.ac.in"
            },
            {
                "aicte_id": "1-209384712",
                "name": "Mumbai Institute of Advanced Technology & Research",
                "code": "MIATR-MH-02",
                "institute_type": InstituteType.ENGINEERING,
                "state": "Maharashtra",
                "district": "Mumbai Suburban",
                "address": "Near Powai Lake, Andheri East, Mumbai",
                "pin_code": "400076",
                "contact_email": "principal@miatr.edu.in",
                "contact_phone": "022-25767000",
                "website": "https://www.miatr.edu.in"
            },
            {
                "aicte_id": "1-309485721",
                "name": "Karnataka National Institute of Management",
                "code": "KNIM-KA-03",
                "institute_type": InstituteType.MANAGEMENT,
                "state": "Karnataka",
                "district": "Bengaluru Urban",
                "address": "Electronic City Phase 1, Hosur Road, Bengaluru",
                "pin_code": "560100",
                "contact_email": "director@knim.edu.in",
                "contact_phone": "080-26993000",
                "website": "https://www.knim.edu.in"
            },
            {
                "aicte_id": "1-409283741",
                "name": "Tamil Nadu Apex College of Pharmacy",
                "code": "TNACP-TN-04",
                "institute_type": InstituteType.PHARMACY,
                "state": "Tamil Nadu",
                "district": "Chennai",
                "address": "Guindy Institutional Area, Anna Salai, Chennai",
                "pin_code": "600025",
                "contact_email": "dean@tnacp.edu.in",
                "contact_phone": "044-22357004",
                "website": "https://www.tnacp.edu.in"
            },
            {
                "aicte_id": "1-509384912",
                "name": "Hyderabad Polytechnic & Skill Institute",
                "code": "HPSI-TS-05",
                "institute_type": InstituteType.POLYTECHNIC,
                "state": "Telangana",
                "district": "Hyderabad",
                "address": "Ramanthapur Main Road, Amberpet, Hyderabad",
                "pin_code": "500013",
                "contact_email": "principal@hpsi.ac.in",
                "contact_phone": "040-27038100",
                "website": "https://www.hpsi.ac.in"
            },
            {
                "aicte_id": "1-609182734",
                "name": "Gujarat School of Planning & Architecture",
                "code": "GSPA-GJ-06",
                "institute_type": InstituteType.ARCHITECTURE,
                "state": "Gujarat",
                "district": "Ahmedabad",
                "address": "Kasturbhai Lalbhai Campus, University Road, Navrangpura",
                "pin_code": "380009",
                "contact_email": "admin@gspa.edu.in",
                "contact_phone": "079-26302470",
                "website": "https://www.gspa.edu.in"
            },
            {
                "aicte_id": "1-709847123",
                "name": "Uttar Pradesh Technical Institute of Engineering",
                "code": "UPTIE-UP-07",
                "institute_type": InstituteType.ENGINEERING,
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "address": "Sector 11, Jankipuram Vistar, Sitapur Road, Lucknow",
                "pin_code": "226031",
                "contact_email": "registrar@uptie.ac.in",
                "contact_phone": "0522-2732193",
                "website": "https://www.uptie.ac.in"
            },
            {
                "aicte_id": "1-809284719",
                "name": "West Bengal Applied Sciences Academy",
                "code": "WBASA-WB-08",
                "institute_type": InstituteType.ENGINEERING,
                "state": "West Bengal",
                "district": "Kolkata",
                "address": "Salt Lake Sector V, Block EP & GP, Bidhannagar, Kolkata",
                "pin_code": "700091",
                "contact_email": "office@wbasa.edu.in",
                "contact_phone": "033-23350119",
                "website": "https://www.wbasa.edu.in"
            }
        ]
        
        inst_objs = {}
        for inst_data in institutions_data:
            inst = Institution(**inst_data, is_active=True)
            db.add(inst)
            db.flush()
            inst_objs[inst_data["code"]] = inst
            
        print("  -> Seeded 8 AICTE accredited institutions across India.")

        # 3. Users
        default_pwd_hash = get_password_hash("Aicte@Portal2026")
        
        users_data = [
            # Administrator
            {
                "username": "admin",
                "email": "admin@aicte-india.org",
                "full_name": "Dr. Narendra K. Verma",
                "role": UserRole.ADMIN,
                "designation": "Director (Grievance & Central Monitoring)",
                "phone": "011-29581001",
                "department_id": dept_objs["CELL_GRIEVANCE"].id,
                "institution_id": None
            },
            # Reviewer
            {
                "username": "reviewer_singh",
                "email": "reviewer.singh@aicte-india.org",
                "full_name": "Dr. Arvind Singh",
                "role": UserRole.REVIEWER,
                "designation": "Senior Reviewing Officer & Triage Specialist",
                "phone": "011-29581045",
                "department_id": dept_objs["CELL_GRIEVANCE"].id,
                "institution_id": None
            },
            # Department Officers
            {
                "username": "officer_approval",
                "email": "officer.approval@aicte-india.org",
                "full_name": "Smt. Priya Sundaram",
                "role": UserRole.DEPT_OFFICER,
                "designation": "Deputy Director (Approval Bureau)",
                "phone": "011-29581022",
                "department_id": dept_objs["BUREAU_APPROVAL"].id,
                "institution_id": None
            },
            {
                "username": "officer_faculty",
                "email": "officer.faculty@aicte-india.org",
                "full_name": "Shri Manoj P. Deshpande",
                "role": UserRole.DEPT_OFFICER,
                "designation": "Assistant Director (Faculty Welfare)",
                "phone": "011-29581033",
                "department_id": dept_objs["BUREAU_FACULTY"].id,
                "institution_id": None
            },
            {
                "username": "officer_student",
                "email": "officer.student@aicte-india.org",
                "full_name": "Dr. Meenakshi Iyer",
                "role": UserRole.DEPT_OFFICER,
                "designation": "Nodal Officer (Student Welfare & Anti-Ragging)",
                "phone": "011-29581055",
                "department_id": dept_objs["CELL_STUDENT_WELFARE"].id,
                "institution_id": None
            },
            # Institution Representatives
            {
                "username": "rep_delhi",
                "email": "registrar@dta-delhi.ac.in",
                "full_name": "Prof. Rajesh Sharma",
                "role": UserRole.INST_REP,
                "designation": "Registrar",
                "phone": "9811029384",
                "department_id": None,
                "institution_id": inst_objs["DTA-DEL-01"].id
            },
            {
                "username": "rep_mumbai",
                "email": "principal@miatr.edu.in",
                "full_name": "Dr. Sunita Deshmukh",
                "role": UserRole.INST_REP,
                "designation": "Principal & Institutional Nodal Head",
                "phone": "9820192837",
                "department_id": None,
                "institution_id": inst_objs["MIATR-MH-02"].id
            },
            {
                "username": "rep_bengaluru",
                "email": "director@knim.edu.in",
                "full_name": "Dr. K. Ramanathan",
                "role": UserRole.INST_REP,
                "designation": "Director",
                "phone": "9845019283",
                "department_id": None,
                "institution_id": inst_objs["KNIM-KA-03"].id
            },
            {
                "username": "rep_chennai",
                "email": "dean@tnacp.edu.in",
                "full_name": "Dr. M. Soundararajan",
                "role": UserRole.INST_REP,
                "designation": "Dean of Academic Affairs",
                "phone": "9444019283",
                "department_id": None,
                "institution_id": inst_objs["TNACP-TN-04"].id
            }
        ]
        
        user_objs = {}
        for u in users_data:
            user = User(
                username=u["username"],
                email=u["email"],
                full_name=u["full_name"],
                hashed_password=default_pwd_hash,
                role=u["role"],
                designation=u["designation"],
                phone=u["phone"],
                department_id=u["department_id"],
                institution_id=u["institution_id"],
                is_active=True
            )
            db.add(user)
            db.flush()
            user_objs[u["username"]] = user
            
        print("  -> Seeded administrative, officer, reviewer and institution representative accounts.")

        # 4. Realistic complaints across diverse categories & statuses
        base_time = datetime.utcnow()
        
        complaints_data = [
            # Complaint 1: In Progress Approval issue
            {
                "complaint_id": "AICTE-2026-00010",
                "institution_id": inst_objs["DTA-DEL-01"].id,
                "complainant_user_id": user_objs["rep_delhi"].id,
                "title": "Delay in Extension of Approval (EoA) Scrutiny for Computer Science & AI Intake",
                "description": "Application submitted on AICTE web portal under Reference #APP-2026-8812 for 60 seat intake increment in B.Tech Computer Science & AI. Despite paying portal scrutiny fee and physical verification clearance by the inspection committee, approval portal status is showing stagnant in pending queue.",
                "category": ComplaintCategory.APPROVAL_AFFILIATION,
                "priority": ComplaintPriority.HIGH,
                "status": ComplaintStatus.IN_PROGRESS,
                "reference_number": "APP-2026-8812",
                "academic_year": "2026-2027",
                "assigned_department_id": dept_objs["BUREAU_APPROVAL"].id,
                "assigned_officer_id": user_objs["officer_approval"].id,
                "created_at": base_time - timedelta(days=12)
            },
            # Complaint 2: Faculty pay scale dispute
            {
                "complaint_id": "AICTE-2026-00011",
                "institution_id": inst_objs["MIATR-MH-02"].id,
                "complainant_user_id": user_objs["rep_mumbai"].id,
                "title": "Non-Implementation of 7th Pay Commission Scale and Dearness Allowance Arrears",
                "description": "Formal grievance lodged regarding the non-adherence to AICTE 7th CPC regulations (Notification F.No. 61-1/RIFD/7th CPC/2016-17) for 42 regular assistant and associate professors. Basic pay calculation and arrears from financial year 2024-25 have been withheld by institutional management committee.",
                "category": ComplaintCategory.FACULTY_STAFF,
                "priority": ComplaintPriority.URGENT,
                "status": ComplaintStatus.ASSIGNED,
                "reference_number": "FAC-PAY-2026-04",
                "academic_year": "2026-2027",
                "assigned_department_id": dept_objs["BUREAU_FACULTY"].id,
                "assigned_officer_id": user_objs["officer_faculty"].id,
                "created_at": base_time - timedelta(days=8)
            },
            # Complaint 3: Duplicate candidate pair (Primary Complaint)
            {
                "complaint_id": "AICTE-2026-00012",
                "institution_id": inst_objs["KNIM-KA-03"].id,
                "complainant_user_id": user_objs["rep_bengaluru"].id,
                "title": "Irregular Capitation and Excess Fee Demanded During MBA Admission Round 2",
                "description": "Several prospective management students have reported that the administrative counter is demanding unauthorized building fund development fees exceeding AICTE mandated ceiling. Demanding immediate state fee regulatory committee intervention and inquiry.",
                "category": ComplaintCategory.STUDENT_FEES,
                "priority": ComplaintPriority.HIGH,
                "status": ComplaintStatus.IN_PROGRESS,
                "reference_number": "FEE-COMP-901",
                "academic_year": "2026-2027",
                "assigned_department_id": dept_objs["CELL_STUDENT_WELFARE"].id,
                "assigned_officer_id": user_objs["officer_student"].id,
                "created_at": base_time - timedelta(days=6)
            },
            # Complaint 4: Duplicate candidate pair (Candidate Complaint - Highly similar to Complaint 3)
            {
                "complaint_id": "AICTE-2026-00013",
                "institution_id": inst_objs["KNIM-KA-03"].id,
                "complainant_user_id": user_objs["rep_bengaluru"].id,
                "title": "Excess Development Fee and Capitation Charges for MBA Admission 2026",
                "description": "Multiple student representations received regarding excessive tuition fee and unauthorized capitation charges demanded by administration during second round of MBA admission. Requesting prompt inspection and fee regulatory compliance.",
                "category": ComplaintCategory.STUDENT_FEES,
                "priority": ComplaintPriority.HIGH,
                "status": ComplaintStatus.UNDER_REVIEW,
                "reference_number": "FEE-COMP-904",
                "academic_year": "2026-2027",
                "assigned_department_id": None,
                "assigned_officer_id": None,
                "created_at": base_time - timedelta(days=2)
            },
            # Complaint 5: Resolved Complaint with full notes
            {
                "complaint_id": "AICTE-2026-00014",
                "institution_id": inst_objs["TNACP-TN-04"].id,
                "complainant_user_id": user_objs["rep_chennai"].id,
                "title": "Disbursement Delay for AICTE Pragati Scholarship for Girl Students",
                "description": "28 eligible female students enrolled in B.Pharm batch 2025-2029 have not received their annual Pragati Scholarship grant credit despite verification on National Scholarship Portal (NSP) by the nodal officer in November.",
                "category": ComplaintCategory.FUNDS_SCHOLARSHIP,
                "priority": ComplaintPriority.MEDIUM,
                "status": ComplaintStatus.RESOLVED,
                "reference_number": "PRAGATI-NSP-771",
                "academic_year": "2026-2027",
                "assigned_department_id": dept_objs["BUREAU_FINANCE"].id,
                "assigned_officer_id": user_objs["officer_student"].id,
                "resolution_notes": "PFMS gateway bank integration glitch resolved. Direct Benefit Transfer (DBT) credit processed successfully for all 28 students on 24 October 2026. UTR numbers communicated to institution.",
                "resolution_date": base_time - timedelta(days=1),
                "created_at": base_time - timedelta(days=15)
            },
            # Complaint 6: Freshly submitted complaint
            {
                "complaint_id": "AICTE-2026-00015",
                "institution_id": inst_objs["DTA-DEL-01"].id,
                "complainant_user_id": user_objs["rep_delhi"].id,
                "title": "Non-Availability of Fire Safety NOC and Structural Stability Certification for Academic Block 4",
                "description": "Urgent technical inspection requested regarding safety violations. Block 4 laboratories have pending fire staircase clearances. Requesting AICTE regional inspection team review prior to end-semester examinations.",
                "category": ComplaintCategory.INFRASTRUCTURE,
                "priority": ComplaintPriority.URGENT,
                "status": ComplaintStatus.SUBMITTED,
                "reference_number": "SAFETY-AUD-2026",
                "academic_year": "2026-2027",
                "assigned_department_id": None,
                "assigned_officer_id": None,
                "created_at": base_time - timedelta(hours=5)
            }
        ]
        
        complaint_records = []
        for c_data in complaints_data:
            c = Complaint(**c_data)
            db.add(c)
            db.flush()
            complaint_records.append(c)
            
        print("  -> Seeded 6 realistic complaints with diverse categories, priorities, and lifecycles.")

        # 5. Status History for complaints
        histories = [
            ComplaintStatusHistory(
                complaint_id=complaint_records[0].id,
                from_status=None,
                to_status=ComplaintStatus.SUBMITTED.value,
                changed_by_user_id=user_objs["rep_delhi"].id,
                comments="Grievance filed officially on the portal with inspection committee receipt.",
                created_at=base_time - timedelta(days=12)
            ),
            ComplaintStatusHistory(
                complaint_id=complaint_records[0].id,
                from_status=ComplaintStatus.SUBMITTED.value,
                to_status=ComplaintStatus.ASSIGNED.value,
                changed_by_user_id=user_objs["reviewer_singh"].id,
                comments="Initial review conducted. Case routed to Approval Bureau for verification.",
                created_at=base_time - timedelta(days=10)
            ),
            ComplaintStatusHistory(
                complaint_id=complaint_records[0].id,
                from_status=ComplaintStatus.ASSIGNED.value,
                to_status=ComplaintStatus.IN_PROGRESS.value,
                changed_by_user_id=user_objs["officer_approval"].id,
                comments="Scrutiny committee reconvened to check laboratory equipment compliance checklist.",
                created_at=base_time - timedelta(days=7)
            ),
            # History for Resolved complaint (Complaint 5)
            ComplaintStatusHistory(
                complaint_id=complaint_records[4].id,
                from_status=None,
                to_status=ComplaintStatus.SUBMITTED.value,
                changed_by_user_id=user_objs["rep_chennai"].id,
                comments="Scholarship non-credit representation filed.",
                created_at=base_time - timedelta(days=15)
            ),
            ComplaintStatusHistory(
                complaint_id=complaint_records[4].id,
                from_status=ComplaintStatus.SUBMITTED.value,
                to_status=ComplaintStatus.IN_PROGRESS.value,
                changed_by_user_id=user_objs["admin"].id,
                comments="Referred to Finance & DBT wing for gateway logs inspection.",
                created_at=base_time - timedelta(days=10)
            ),
            ComplaintStatusHistory(
                complaint_id=complaint_records[4].id,
                from_status=ComplaintStatus.IN_PROGRESS.value,
                to_status=ComplaintStatus.RESOLVED.value,
                changed_by_user_id=user_objs["admin"].id,
                comments="All 28 scholarship transfers confirmed via PFMS. Redressal closure report generated.",
                created_at=base_time - timedelta(days=1)
            ),
        ]
        db.add_all(histories)
        db.flush()

        # 6. Assignments
        assignments = [
            ComplaintAssignment(
                complaint_id=complaint_records[0].id,
                department_id=dept_objs["BUREAU_APPROVAL"].id,
                assigned_to_user_id=user_objs["officer_approval"].id,
                assigned_by_user_id=user_objs["reviewer_singh"].id,
                instructions="Expedite EoA scrutiny verification within 7 working days.",
                is_active=True,
                created_at=base_time - timedelta(days=10)
            ),
            ComplaintAssignment(
                complaint_id=complaint_records[1].id,
                department_id=dept_objs["BUREAU_FACULTY"].id,
                assigned_to_user_id=user_objs["officer_faculty"].id,
                assigned_by_user_id=user_objs["reviewer_singh"].id,
                instructions="Issue formal show cause to management regarding 7th CPC salary scales.",
                is_active=True,
                created_at=base_time - timedelta(days=8)
            ),
        ]
        db.add_all(assignments)
        db.flush()

        # 7. Duplicate Suggestion Pair (between Complaint 3 and Complaint 4)
        dup_suggestion = DuplicateSuggestion(
            complaint_id=complaint_records[3].id, # Complaint 4
            potential_duplicate_id=complaint_records[2].id, # Complaint 3
            similarity_score=0.8450,
            matched_keywords="admission, development, excessive, capitation, fee, charges, mba, regulatory",
            status=DuplicateReviewStatus.PENDING,
            suggested_at=base_time - timedelta(days=2)
        )
        db.add(dup_suggestion)
        db.flush()
        print("  -> Seeded high-confidence duplicate pair candidate for Reviewer desk.")

        # 8. Department Coordination Note
        coord = DepartmentCoordination(
            complaint_id=complaint_records[0].id,
            from_department_id=dept_objs["BUREAU_APPROVAL"].id,
            to_department_id=dept_objs["BUREAU_ACADEMIC"].id,
            initiated_by_user_id=user_objs["officer_approval"].id,
            subject="Verification of Model Curriculum Faculty Ratios for CSE-AI Branch",
            message="Kindly confirm whether the prescribed faculty cadre ratio of 1:15 is satisfied for the proposed AICTE Model Curriculum intake.",
            response_message="Verified. Curriculum hours and lab ratios are compliant as per Handbook 2026-27.",
            responded_by_user_id=user_objs["admin"].id,
            responded_at=base_time - timedelta(days=5),
            status="RESOLVED",
            created_at=base_time - timedelta(days=6)
        )
        db.add(coord)

        # 9. Audit Logs
        audit_records = [
            AuditLog(
                user_id=user_objs["admin"].id,
                action="SYSTEM_INIT",
                entity_type="SYSTEM",
                entity_id="AICTE-CORE",
                ip_address="127.0.0.1",
                details="AICTE Complaint Monitoring System initialized and seeded with standard schema",
                created_at=base_time - timedelta(days=20)
            ),
            AuditLog(
                user_id=user_objs["reviewer_singh"].id,
                action="COMPLAINT_ASSIGNED",
                entity_type="COMPLAINT",
                entity_id=str(complaint_records[0].id),
                ip_address="192.168.1.10",
                details="Assigned AICTE-2026-00010 to Approval Bureau",
                created_at=base_time - timedelta(days=10)
            ),
            AuditLog(
                user_id=user_objs["admin"].id,
                action="COMPLAINT_RESOLVED",
                entity_type="COMPLAINT",
                entity_id=str(complaint_records[4].id),
                ip_address="192.168.1.1",
                details="Marked AICTE-2026-00014 as RESOLVED after PFMS credit confirmation",
                created_at=base_time - timedelta(days=1)
            ),
        ]
        db.add_all(audit_records)

        # 10. Notifications
        notifications = [
            Notification(
                user_id=user_objs["reviewer_singh"].id,
                title="Potential Duplicate Grievance Alert",
                message="A newly submitted grievance (AICTE-2026-00013) shares 84.5% keyword similarity with AICTE-2026-00012.",
                link="/reviewer",
                is_read=False,
                created_at=base_time - timedelta(days=2)
            ),
            Notification(
                user_id=user_objs["rep_delhi"].id,
                title="Grievance AICTE-2026-00010 Assigned",
                message="Your grievance regarding EoA Scrutiny has been assigned to Approval & Affiliation Bureau.",
                link=f"/complaints/{complaint_records[0].id}",
                is_read=True,
                created_at=base_time - timedelta(days=10)
            ),
            Notification(
                user_id=user_objs["officer_faculty"].id,
                title="Urgent Case Assignment",
                message="Grievance AICTE-2026-00011 (Faculty Pay Scale Arrears) has been marked URGENT and assigned to your bureau.",
                link=f"/complaints/{complaint_records[1].id}",
                is_read=False,
                created_at=base_time - timedelta(days=8)
            )
        ]
        db.add_all(notifications)
        
        db.commit()
        print("Database successfully seeded with complete Indian government institutional dataset!")
        
    except Exception as e:
        db.rollback()
        print(f"Error during database seed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
