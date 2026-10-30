import bcrypt from "bcryptjs";
import { q, one } from "./index.js";

const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

export async function seed() {
  const hash = (p: string) => bcrypt.hashSync(p, 10);
  const add = async (u: Record<string, unknown>) => {
    const keys = Object.keys(u);
    const row = await one<{ id: number }>(
      `INSERT INTO users (${keys.join(",")}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(",")}) RETURNING id`,
      Object.values(u),
    );
    return row!.id;
  };

  await add({ name: "Thandi Admin", email: "admin@mbono.co.za", password_hash: hash("Admin@123"), role: "admin", status: "active", phone: "+27 41 000 0001", location: "Gqeberha" });
  const r1 = await add({ name: "Sipho Ndlovu", email: "recruiter@mbono.co.za", password_hash: hash("Recruiter@123"), role: "recruiter", status: "active", phone: "+27 11 000 0002", location: "Johannesburg", company_name: "MBONO Recruitment Services", company_website: "https://mbono.co.za", company_industry: "Human Resources", company_description: "Specialist recruitment partner connecting South African talent with leading employers." });
  const r2 = await add({ name: "Lerato Mokoena", email: "lerato@finserv.co.za", password_hash: hash("Recruiter@123"), role: "recruiter", status: "active", phone: "+27 21 000 0003", location: "Cape Town", company_name: "Ubuntu Financial Group", company_website: "https://example.co.za", company_industry: "Finance", company_description: "Financial services group with offices nationwide." });
  await add({ name: "Pending Recruiter", email: "pending@talentco.co.za", password_hash: hash("Recruiter@123"), role: "recruiter", status: "pending", location: "Durban", company_name: "TalentCo KZN", company_industry: "Logistics" });
  const c1 = await add({ name: "Ayanda Zulu", email: "candidate@mbono.co.za", password_hash: hash("Candidate@123"), role: "candidate", status: "active", phone: "+27 82 000 0004", location: "Gqeberha, Eastern Cape", headline: "Customer Experience Specialist", bio: "Bilingual customer service professional with 4 years in contact centres.", skills: "Customer service, CRM, isiXhosa, English, Excel", experience: "4 years - Contact centre agent and team lead", education: "National Diploma: Business Management (NMU)" });
  const c2 = await add({ name: "Kabelo Dlamini", email: "kabelo@example.com", password_hash: hash("Candidate@123"), role: "candidate", status: "active", location: "Johannesburg, Gauteng", headline: "Junior Data Analyst", skills: "SQL, Excel, Power BI, Python", experience: "1 year internship", education: "BCom Information Systems (Wits)" });
  const c3 = await add({ name: "Naledi Khumalo", email: "naledi@example.com", password_hash: hash("Candidate@123"), role: "candidate", status: "active", location: "Cape Town, Western Cape", headline: "Software Developer", skills: "JavaScript, React, Node.js, SQL", experience: "2 years full-stack", education: "BSc Computer Science (UCT)" });

  const jobs: [string, string, string, string, string, string, number, number, number, boolean, number][] = [
    ["Customer Experience Consultant", "Ubuntu Financial Group", "Gqeberha", "Eastern Cape", "Full-time", "Customer Service", 14000, 18000, 21, true, r2],
    ["Junior Data Analyst", "MBONO Tech Partner", "Johannesburg", "Gauteng", "Full-time", "Information Technology", 22000, 30000, 18, true, r1],
    ["Talent Acquisition Specialist", "MBONO Recruitment Services", "Durban", "KwaZulu-Natal", "Permanent", "Human Resources", 28000, 38000, 25, true, r1],
    ["Graduate Software Developer", "Coastal Digital", "Cape Town", "Western Cape", "Graduate Programme", "Information Technology", 18000, 24000, 30, true, r1],
    ["Accounts Payable Clerk", "Ubuntu Financial Group", "East London", "Eastern Cape", "Full-time", "Finance", 15000, 19000, 14, false, r2],
    ["IT Service Desk Analyst", "MBONO Tech Partner", "Pretoria", "Gauteng", "Contract", "Information Technology", 20000, 26000, 20, true, r1],
    ["Warehouse Operations Supervisor", "Karoo Logistics", "Bloemfontein", "Free State", "Full-time", "Logistics", 25000, 32000, 16, false, r1],
    ["Digital Marketing Assistant", "Coastal Digital", "Remote", "South Africa", "Part-time", "Marketing", 12000, 16000, 28, false, r1],
    ["Registered Nurse", "Lowveld Health", "Nelspruit", "Mpumalanga", "Full-time", "Healthcare", 30000, 42000, 24, true, r1],
    ["Learnership: Contact Centre Support", "Ubuntu Financial Group", "Gqeberha", "Eastern Cape", "Learnership", "Customer Service", 5000, 7000, 12, false, r2],
    ["Mining Engineer", "Bushveld Minerals", "Rustenburg", "North West", "Permanent", "Engineering", 55000, 75000, 35, false, r1],
    ["Field Sales Representative", "Karoo Logistics", "Polokwane", "Limpopo", "Full-time", "Sales", 16000, 25000, 19, false, r1],
  ];
  const ids: number[] = [];
  for (const [title, company, location, province, type, industry, min, max, days, featured, rid] of jobs) {
    const row = await one<{ id: number }>(
      `INSERT INTO jobs (title, company, location, province, employment_type, industry, salary_min, salary_max, description, requirements, closing_date, featured, recruiter_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [title, company, location, province, type, industry, min, max,
        `${company} is looking for a motivated ${title} to join the team in ${location}. You will work with a supportive team, grow your skills and make a real impact for clients across South Africa.`,
        "Matric (Grade 12) or relevant qualification\nStrong communication skills\nRelevant experience is an advantage\nValid South African ID or work permit",
        daysFromNow(days), featured, rid],
    );
    ids.push(row!.id);
  }

  const app = async (job: number, cand: number, status: string) =>
    (await one<{ id: number }>("INSERT INTO applications (job_id, candidate_id, cover_letter, status) VALUES ($1,$2,$3,$4) RETURNING id", [job, cand, "I am excited to apply for this role.", status]))!.id;
  const a1 = await app(ids[0], c1, "Interview");
  await app(ids[9], c1, "Under Review");
  await app(ids[1], c2, "Shortlisted");
  await app(ids[3], c3, "Submitted");
  await app(ids[5], c2, "Submitted");
  await q("INSERT INTO interviews (application_id, scheduled_at, mode, location, notes) VALUES ($1,$2,$3,$4,$5)",
    [a1, `${daysFromNow(3)}T10:00`, "In person", "Ubuntu Financial Group, 12 Main Rd, Gqeberha", "Please bring a copy of your ID and qualifications."]);
  await q("INSERT INTO saved_jobs (user_id, job_id) VALUES ($1,$2)", [c1, ids[2]]);
  await q("INSERT INTO saved_jobs (user_id, job_id) VALUES ($1,$2)", [c1, ids[4]]);
  await q("INSERT INTO notifications (user_id, title, message) VALUES ($1,$2,$3)", [c1, "Interview invitation", "You have been invited to an interview for Customer Experience Consultant."]);

  const content: Record<string, string> = {
    hero_title: "Connecting Talent with Opportunity",
    hero_subtitle: "MBONO Recruitment Services helps skilled professionals find meaningful career opportunities while helping companies recruit top talent.",
    announcement: "",
    contact_email: "info@mbono.co.za",
    contact_phone: "+27 41 123 4567",
    contact_address: "Nelson Mandela Bay, Gqeberha, Eastern Cape, South Africa",
    office_hours: "Mon - Fri: 08:00 - 17:00",
  };
  for (const [k, v] of Object.entries(content)) await q("INSERT INTO site_content (key, value) VALUES ($1,$2)", [k, v]);
  const settings: Record<string, string> = { allow_registrations: "true", require_recruiter_approval: "true", max_upload_mb: "5", maintenance_mode: "false" };
  for (const [k, v] of Object.entries(settings)) await q("INSERT INTO settings (key, value) VALUES ($1,$2)", [k, v]);
  console.log("[db] seeded demo data");
}
