import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const USERS_STORE_PATH =
  process.env.SUPER_ADMIN_USERS_STORE_PATH ||
  path.join(os.tmpdir(), "gmtgroupbe-super-admin-users.json");

const defaultUsers = [
  {
    id: 12,
    name: "Budi Santoso",
    ttl: "Jakarta, 12-05-1995",
    phone_number: "081234567890",
    gender: "male",
    email: "budi@example.com",
    domicile: "Jakarta Selatan",
    role: "agent",
    is_suspended: false,
    detail_user: {
      id: 5,
      user_id: 12,
      company_name: "PT Maju Bersama",
      job: "Sales Specialist",
      photo: "/uploads/users/photo_12.jpg",
      ktp_photo: "/uploads/ktp/ktp_12.jpg",
      status: "official_agent"
    },
    created_at: "2026-08-01T10:00:00Z",
    updated_at: "2026-08-05T08:30:00Z"
  },
  {
    id: 1,
    name: "Super Admin GMT",
    ttl: "Jakarta, 01-01-1990",
    phone_number: "081111111111",
    gender: "male",
    email: "superadmin@gmtgroup.id",
    domicile: "Jakarta Pusat",
    role: "super_admin",
    is_suspended: false,
    detail_user: {
      id: 1,
      user_id: 1,
      company_name: "GMT Group Pusat",
      job: "System Administrator",
      photo: null,
      ktp_photo: null,
      status: "official_agent"
    },
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-08-05T00:00:00Z"
  },
  {
    id: 2,
    name: "Siti Rahma",
    ttl: "Bandung, 20-08-1997",
    phone_number: "082198765432",
    gender: "female",
    email: "siti.rahma@gmtgroup.id",
    domicile: "Bandung",
    role: "sales",
    is_suspended: false,
    detail_user: {
      id: 2,
      user_id: 2,
      company_name: "GMT Sales Division",
      job: "Account Executive",
      photo: null,
      ktp_photo: null,
      status: null
    },
    created_at: "2026-03-15T09:00:00Z",
    updated_at: "2026-08-02T11:20:00Z"
  },
  {
    id: 3,
    name: "Andi Wijaya",
    ttl: "Surabaya, 05-11-1992",
    phone_number: "085712344321",
    gender: "male",
    email: "andi.mkt@gmtgroup.id",
    domicile: "Surabaya",
    role: "marketing",
    is_suspended: false,
    detail_user: {
      id: 3,
      user_id: 3,
      company_name: "GMT Marketing Hub",
      job: "Digital Marketer",
      photo: null,
      ktp_photo: null,
      status: null
    },
    created_at: "2026-04-10T14:30:00Z",
    updated_at: "2026-07-28T16:45:00Z"
  },
  {
    id: 4,
    name: "Dewi Lestari",
    ttl: "Yogyakarta, 14-02-1998",
    phone_number: "081399887766",
    gender: "female",
    email: "dewi.user@example.com",
    domicile: "Yogyakarta",
    role: "user",
    is_suspended: false,
    detail_user: {
      id: 4,
      user_id: 4,
      company_name: "CV Creative Studio",
      job: "Content Writer",
      photo: null,
      ktp_photo: null,
      status: "not_verif"
    },
    created_at: "2026-06-20T08:15:00Z",
    updated_at: "2026-08-04T12:10:00Z"
  },
  {
    id: 5,
    name: "Eko Prasetyo",
    ttl: "Semarang, 30-09-1993",
    phone_number: "087855443322",
    gender: "male",
    email: "eko.suspended@example.com",
    domicile: "Semarang",
    role: "agent",
    is_suspended: true,
    detail_user: {
      id: 6,
      user_id: 5,
      company_name: "PT Nusantara Jaya",
      job: "Field Agent",
      photo: null,
      ktp_photo: null,
      status: "stopped_agent"
    },
    created_at: "2026-05-12T11:00:00Z",
    updated_at: "2026-08-03T15:00:00Z"
  }
];

export async function readUsers() {
  try {
    const raw = await fs.readFile(USERS_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultUsers;
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeUsers(defaultUsers);
      return defaultUsers;
    }
    return defaultUsers;
  }
}

export async function writeUsers(users) {
  const safeUsers = Array.isArray(users) ? users : [];
  await fs.mkdir(path.dirname(USERS_STORE_PATH), { recursive: true });
  await fs.writeFile(USERS_STORE_PATH, JSON.stringify(safeUsers, null, 2), "utf8");
}
