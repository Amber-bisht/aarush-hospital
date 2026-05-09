# User Role Capabilities

This document outlines the permissions and workflows for each user role within the Hospital Management System.

## Role Breakdown

| Role | Core Responsibilities | Key Actions |
| :--- | :--- | :--- |
| **Admin** | System Management & Oversight | • Access full dashboard with revenue and appointment analytics.<br>• Perform CRUD (Create, Read, Update, Delete) on all Doctors and Patients.<br>• View all appointments and billing records across the hospital.<br>• Manage system-wide data. |
| **Doctor** | Clinical Care & Workload Management | • View personal appointment schedule.<br>• Access profiles of patients under their care.<br>• Create and update medical prescriptions.<br>• Reschedule or cancel their own appointments.<br>• Automatically mark appointments as "Completed" upon prescribing. |
| **Patient** | Self-Service & Personal Health Records | • Search for doctors by name or specialization.<br>• Book new appointments.<br>• View personal medical history (prescriptions) and bills.<br>• Reschedule or cancel their own upcoming appointments.<br>• Access their own profile details. |

---

## Access Control & Security

The system implements **Role-Based Access Control (RBAC)** to ensure data privacy and security:

1. **Privacy**: Patients can only access their own records. They cannot see other patients' data or doctors' internal notes not shared with them.
2. **Clinical Integrity**: Only the assigned Doctor (or an Admin) can modify prescriptions or appointment statuses for a specific patient encounter.
3. **Operational Transparency**: Admins have a global view to monitor hospital performance, revenue trends, and staff workload without interfering in specific clinical decisions unless necessary.
