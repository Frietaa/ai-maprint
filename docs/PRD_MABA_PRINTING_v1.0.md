# MABA PRINTING — Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** FROZEN BASELINE / Source of Truth  
**Product:** MABA PRINTING  
**Application Type:** Web Application  
**Primary Target:** Mahasiswa, dengan konsumen umum tetap dapat menggunakan layanan  
**UI Language:** Bahasa Indonesia  
**Architecture Reference:** `ARCHITECTURE_MABA_PRINTING_v1.0.md`

---

## 1. Purpose

Dokumen ini adalah **source of truth untuk WHAT**: apa yang harus dibangun, siapa penggunanya, perilaku produk, batas MVP, business rules, dan kriteria selesai. Implementasi teknis MUST mengikuti Technical Architecture. Konflik material MUST dilaporkan; AI/developer tidak boleh mengisi ambiguity penting dengan asumsi diam-diam.

## 2. Product Overview

MABA PRINTING adalah website layanan terpadu yang menghubungkan usaha dan konsumen melalui empat lini:

1. Jasa cetak dokumen.
2. Penjualan ATK.
3. Jasa service laptop.
4. Jasa instalasi software.

Website menyediakan informasi usaha/lokasi, katalog, request/order, upload file, tracking, Member history, Admin Panel, serta WhatsApp deep link. MVP bukan full e-commerce marketplace; detail pekerjaan yang memerlukan diskusi dapat dikonfirmasi melalui WhatsApp.

## 3. Product Goals

MVP MUST:
- modern, minimalis, responsive, dan mudah dinavigasi;
- mendukung beberapa lokasi;
- mendukung Guest order tanpa akun;
- mendukung Member account dan order history;
- mendukung Email/Password dan Google authentication;
- menerima multiple file upload yang relevan;
- menghasilkan Public Order ID yang aman;
- menyediakan order tracking;
- menyediakan Admin Panel;
- mengelola products, services, locations, availability, prices, orders, payment status, dan business information;
- menyediakan WhatsApp deep link;
- mendukung Cash dan static QRIS;
- menjaga file konsumen private;
- mempunyai validation, authorization, audit, error handling, dan testing.

## 4. Non-Goals — MVP

MVP MUST NOT secara otomatis mencakup:
- native mobile application;
- multi-vendor marketplace;
- automatic payment gateway/webhook;
- WhatsApp Business API/chatbot/OTP/automatic notification;
- live chat/push notification;
- Maps/GPS automatic distance;
- complex courier system;
- numeric inventory;
- image editor;
- loyalty/review/promo engine kompleks;
- advanced analytics.

## 5. User Roles

### Guest
MUST dapat mengakses public website, melihat catalog/location, membuat order/request, upload file bila relevan, dan tracking dengan Public Order ID. Guest tidak mempunyai permanent account.

### Member
MUST dapat register, login, Google login, logout, mengelola profile dasar, membuat order, dan melihat order miliknya. Member MUST NOT dapat melihat private order Member lain.

### Admin
Sistem MUST mendukung multiple Admin dengan permission MVP yang sama. Admin mengelola area operasional dan tindakan penting MUST auditable.

## 6. Authentication

- **FR-AUTH-001 MUST:** Guest dapat menggunakan website dan membuat request tanpa account.
- **FR-AUTH-002 MUST:** Member registration dengan Email + Password.
- **FR-AUTH-003 MUST:** Member login dengan Email + Password.
- **FR-AUTH-004 MUST:** Google authentication.
- **FR-AUTH-005 MUST:** protected Admin authentication.
- WhatsApp number adalah contact/profile information.
- WhatsApp OTP adalah FUTURE, bukan MVP.
- `Continue as Guest` adalah UX/navigation choice, bukan authentication palsu.

## 7. Homepage

MUST mempunyai Hero, business introduction, service summary, locations, CTA, WhatsApp access, dan navigation menuju catalog/request. UI SHOULD mobile-first, mempunyai clear hierarchy, whitespace yang baik, smooth non-disruptive animation, dan state loading/error/empty ketika relevan.

## 8. Printing Service

MUST mempunyai printing catalog/request. Request minimal dapat memuat consumer name, WhatsApp/contact, optional location, deadline, description, dan optional files.

MVP tidak mewajibkan dedicated field untuk paper size, BW/color, copies, duplex, finishing. Detail dapat dikonfirmasi melalui description/WhatsApp. Admin dapat menetapkan final price tanpa mengubah original consumer request.

## 9. File Management

- Multiple files MUST didukung.
- Mixed supported types MAY diunggah bersama.
- Candidate formats: PDF, DOCX, PPTX, XLSX, JPG/JPEG, PNG.
- Allowed types/count/max size MUST configurable dan divalidasi server-side.
- Unsupported/oversized file SHOULD diarahkan melalui WhatsApp.
- Customer files MUST private dan tidak mempunyai predictable public URL.
- Storage identifiers MUST randomized/safe; original filename MAY disimpan sebagai metadata.
- File order `COMPLETED` dapat eligible deletion setelah 30 hari.
- Sensitive document content MUST NOT dicatat di log.
- Admin download MUST authorized.

## 10. ATK

Catalog MUST mendukung name, category, description, price, image, availability.

Availability MVP:
- `AVAILABLE`
- `UNAVAILABLE`

MVP tidak membutuhkan numeric stock. Consumer dapat memilih product dan quantity. Fixed price dapat menghasilkan estimated subtotal/total. Historical order MUST mempertahankan snapshot nama/harga sehingga perubahan catalog tidak mengubah order lama.

## 11. Laptop Service

Request MUST mendukung complaint, handover date bila relevan, desired completion, handover method, dan pickup address bila diperlukan.

Handover:
- `DROP_OFF`
- `PICKUP`

Pickup rule:
- distance ≤ 5 km → FREE;
- distance > 5 km → Rp2.000 per additional kilometer.

MVP tidak menggunakan Maps API. Distance dan fee dapat dikonfirmasi manual oleh Admin.

## 12. Software Installation

Request MUST memungkinkan consumer menjelaskan software, kebutuhan, waktu, contact, dan description. Layanan hanya ditujukan untuk software legal: licensed, free, open-source, atau software dengan valid license/hak penggunaan dari consumer.

Price:
- `FIXED`
- `REQUIRES_CONFIRMATION`

## 13. Unified Order System

Order types:
- `PRINTING`
- `ATK`
- `LAPTOP_SERVICE`
- `SOFTWARE_INSTALLATION`

Setiap order MUST mempunyai internal identifier, unique Public Order ID, customer snapshot, type, status, timestamps, relevant details, optional location/deadline/final price/Admin notes.

Public Order ID MUST unique dan non-predictable serta tidak mengekspos sequential DB identifier. Human-readable example: `MP-2026-A7K92D`.

Guest order mempunyai nullable/no `user_id`; Member order terkait Member account. Customer snapshot MUST tetap dipertahankan.

## 14. Order Status

Internal:
- `SUBMITTED`
- `CONFIRMED`
- `IN_PROGRESS`
- `READY`
- `COMPLETED`
- `CANCELLED`

Default transitions:
- `SUBMITTED → CONFIRMED | CANCELLED`
- `CONFIRMED → IN_PROGRESS | CANCELLED`
- `IN_PROGRESS → READY | CANCELLED`
- `READY → COMPLETED`
- `COMPLETED` terminal
- `CANCELLED` terminal

Backend MUST validate transitions.

Consumer labels:
- SUBMITTED → Menunggu Konfirmasi
- CONFIRMED → Pesanan Diterima
- IN_PROGRESS → Sedang Dikerjakan
- READY → Siap/Selesai
- COMPLETED → Pesanan Selesai
- CANCELLED → Dibatalkan

## 15. Status History

Status changes MUST record order, previous status, new status, Admin actor, dan timestamp. Historical status SHOULD immutable melalui normal application flow.

## 16. Tracking

Guest tracking menggunakan Public Order ID dan MUST hanya mengembalikan safe minimum seperti Public ID, type, status, order date, requested completion. MUST NOT mengekspos private files, phone/WhatsApp, private address, internal user ID, Admin notes, atau sensitive payment data. Public tracking SHOULD rate-limited.

Member hanya dapat melihat private detail order miliknya.

## 17. WhatsApp

MVP menggunakan WhatsApp deep link only. Primary number MUST configurable dan sama untuk semua lokasi pada MVP. Tidak ada Business API, webhook, bot, atau automatic notification.

Contoh pesan: `Halo MABA PRINTING, saya ingin membahas pesanan MP-XXXXXX.`

## 18. Payment

Methods:
- `CASH`
- `QRIS_STATIC`

Statuses:
- `UNPAID`
- `PENDING_CONFIRMATION`
- `PAID`

Memilih QRIS MUST NOT otomatis menjadi PAID. Admin melakukan manual confirmation. QRIS image MUST owner-configurable. Tidak ada automatic payment gateway pada MVP.

## 19. Locations

MUST mendukung multiple locations dengan name, address, opening hours, active status, dan service availability. Consumer MAY memilih location. Operational data MUST tidak tersebar sebagai hardcoded values di banyak components.

## 20. Admin Panel

MUST menyediakan:
- Admin Login
- Dashboard
- Orders
- Order Detail
- Products
- Services
- Locations
- Business Settings

Admin MUST dapat melihat request/files, mengubah valid status, menetapkan final price, memperbarui payment status, dan menambah Admin notes.

Normal Admin edit MUST NOT overwrite original consumer name/contact/description/file/request time.

## 21. Admin Audit Trail

Important Admin actions MUST auditable. Record SHOULD mencakup Admin ID, action, target, old/new values bila relevan, dan timestamp. Tidak semua UI click perlu diaudit.

## 22. Business Configuration

Owner-editable/configurable information:
- business name;
- WhatsApp number;
- logo;
- QRIS image;
- locations/opening hours;
- social links;
- public business information.

Products, Services, Locations, availability, dan prices SHOULD database/Admin-managed ketika sesuai.

## 23. Brand & UI/UX

Direction:
- modern;
- minimalist;
- friendly;
- student-oriented;
- coherent;
- simple navigation.

MUST responsive pada mobile/tablet/desktop. SHOULD mempunyai consistent spacing, accessible labels, visible focus, loading/empty/success/validation/error states, dan subtle animation. Owner mempunyai logo sendiri dan harus dapat menggantinya dari location/configuration yang jelas.

## 24. Sitemap

```text
/
├── Home
├── /printing
│   ├── Catalog
│   └── Request
├── /atk
│   ├── Catalog
│   └── Purchase Request
├── /laptop-service
│   └── Request
├── /software-installation
│   └── Request
├── /locations
├── /track-order
├── /auth
│   ├── Login
│   ├── Sign Up
│   ├── Google
│   └── Continue as Guest
├── /account
│   ├── Profile
│   └── Orders
└── /admin
    ├── Login
    ├── Dashboard
    ├── Orders
    ├── Order Detail
    ├── Products
    ├── Services
    ├── Locations
    └── Business Settings
```

## 25. Conceptual Domain Model

User, Location, Product, ProductCategory, Service, ServiceCategory, Order, OrderItem, Service Request Detail, OrderFile, Payment, OrderStatusHistory, AdminAuditLog, BusinessSetting. Admin dapat direpresentasikan sebagai User dengan role `ADMIN`.

## 26. Security Requirements

MVP MUST:
- secure password hashing;
- secrets via environment;
- backend authorization;
- never trust frontend role claims;
- server validation;
- upload type/size/count validation;
- randomized file storage identifiers;
- private files;
- unpredictable Public Order ID;
- reasonable rate limits;
- backend Google verification;
- no production secret/stack trace leakage;
- auditable important changes.

Security MUST NOT dinonaktifkan hanya agar feature bekerja.

## 27. Non-Functional Requirements

Homepage SHOULD target sekitar ≤2.5s dalam kondisi mobile/network wajar dengan mempertimbangkan free-tier. Gunakan image optimization, lazy loading, code splitting, pagination, indexes, efficient queries bila relevan.

MUST usable mobile/tablet/desktop. SHOULD menggunakan semantic HTML, labels, keyboard-friendly interactions, visible focus. Public pages SHOULD SEO-friendly; Admin pages MUST NOT ditujukan untuk indexing.

## 28. Error Handling

API error SHOULD konsisten, contoh:

```json
{
  "message": "Validation failed",
  "errors": {}
}
```

Frontend MUST menangani loading, success, empty, validation/network/server error, 401, 403, 404. Production MUST NOT membocorkan secrets/stack traces.

## 29. Testing

Backend SHOULD test service/business rules, validation, authorization, API integration. Frontend SHOULD test critical components/forms/flows.

Critical flows:
1. Guest → Order.
2. Member → Order.
3. Member → History.
4. Guest → Track.
5. Admin → Order.
6. Admin → valid Status Update.

## 30. MVP Boundary

### MUST
Public website, service/catalog pages, multiple locations, Guest ordering, Member account, Email/Password + Google auth, four service lines, multiple file upload, unified orders, Public Order ID, tracking, Member history, Admin Panel, catalog/service/location/order management, status history, Cash, static QRIS, payment status, WhatsApp deep link, private files, Admin audit, responsive UI, baseline security/testing.

### FUTURE
WhatsApp OTP/automation, payment gateway/webhook, Maps/GPS, advanced analytics, numeric inventory, promo engine, push/live chat, native app, reviews, loyalty.

## 31. Definition of Done — Feature

Feature selesai jika requirement dan architecture dipenuhi, validation/authorization ada ketika relevan, migration ada bila schema berubah, relevant tests lulus, tidak ada secrets, no critical regression, dan project documentation diperbarui.

## 32. Definition of Done — MVP

MVP selesai jika semua MUST requirements selesai; migrations valid; required seed/bootstrap tersedia; relevant tests/builds lulus; Guest/Member order, tracking, private upload, Admin auth/status, Cash/QRIS, WhatsApp, responsive/security bekerja; production DB/deployment terkonfigurasi; production smoke tests lulus.

## 33. Intentionally Configurable

Belum di-hardcode:
- final logo;
- WhatsApp number;
- addresses;
- opening hours;
- QRIS image;
- social links;
- final brand colors/typography;
- actual products/prices;
- actual service details/prices;
- business images.

Development placeholders MAY digunakan.

## 34. Specification Freeze

PRD v1.0 adalah baseline MVP. Nice-to-have baru masuk FUTURE/backlog kecuali disetujui. Bug/security/contradiction/technical impossibility MUST dilaporkan. AI/developer MUST NOT mengarang requirement material.

## 35. Source-of-Truth Rule

PRD menentukan **WHAT**. Technical Architecture menentukan **HOW**. Accepted Decisions memperjelas keputusan. Current Task menentukan active scope. Jika konflik material tidak dapat diselesaikan dari hierarchy, STOP dan minta keputusan.

---

**End of PRD — MABA PRINTING v1.0**
