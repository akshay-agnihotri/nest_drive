<div align="center">
<h1>Stor## 🧩 How It Works (Flow)

1. **Upload** → File stored once in Appwrite Storage + file document created + user document updated
2. **Browse** → Filter by type, search by name, sort by multiple criteria (all server-side processed)
3. **Share** → New file document created for target user referencing same `bucketField`
4. **Rename** → Only updates that user's document (`name` field)
5. **Delete** → Removes user's document; if last reference → removes storage file
6. **List** → User's document holds an array of file document refs for fast retrieval

## 🎯 Search & Sort System

| Feature          | Implementation                         | Performance                   |
| ---------------- | -------------------------------------- | ----------------------------- |
| **Search**       | Debounced (300ms) real-time filtering  | Server-side processing        |
| **Sort Options** | Name A-Z/Z-A, Size, Date Oldest/Newest | Optimized database queries    |
| **URL State**    | Search & sort params preserved in URL  | Shareable filtered views      |
| **File Types**   | 8 categories with dedicated navigation | Type-specific icons & routing |

### Supported File Types

- 📄 **Documents** - PDF, DOC, DOCX, TXT
- 🖼️ **Images** - JPG, PNG, GIF, SVG, WEBP
- 🎥 **Videos** - MP4, AVI, MOV, WEBM
- 🎵 **Audio** - MP3, WAV, AAC, OGG
- 📊 **Spreadsheets** - XLS, XLSX, CSV
- 📑 **Presentations** - PPT, PPTX
- 💻 **Code** - JS, TS, HTML, CSS, PY, etc.
- 📦 **Archives** - ZIP, RAR, 7Z, TARstDrive)</h1>
<p><strong>Fast, simple, copy‑based personal file storage & sharing.</strong></p>
<p>Upload • Preview • Share • Rename • Delete — each user manages an independent copy.</p>
</div>

## 🚀 Core Concept

StoreIt uses a <strong>copy-based sharing architecture</strong>. When you share a file, the recipient gets their own database document pointing to the same underlying storage object. That means:

- Their rename doesn’t affect yours
- Deleting your copy never breaks theirs
- Storage deletes only when the last copy is gone

## ✨ Features

- 🔐 Authenticated, user‑scoped file library
- 📤 Upload with automatic type detection & size tracking
- 🔍 **Real-time search** with debounced input (300ms delay)
- 🔄 **Advanced sorting** (6 options: name A-Z/Z-A, size, date oldest/newest)
- 🗂️ **File type filtering** (documents, images, videos, audio, spreadsheets, presentations, code, archives)
- 🧬 Independent rename per user (no clashes)
- 🤝 Share via real-time user lookup (debounced email search)
- 🗑️ Smart delete (auto cleans storage when last reference removed)
- 🛡️ Permission & ownership validation on every mutation
- ♻️ Resilient error handling + rollback & retry logic
- 🔗 **URL state management** for search/sort persistence
- ⚡ **Server-side processing** for optimal performance

## 🧩 How It Works (Flow)

1. **Upload** → File stored once in Appwrite Storage + file document created + user document updated
2. **Share** → New file document created for target user referencing same `bucketField`
3. **Rename** → Only updates that user’s document (`name` field)
4. **Delete** → Removes user’s document; if last reference → removes storage file
5. **List** → User’s document holds an array of file document refs for fast retrieval

## 🛠️ Tech Stack

| Layer            | Tools                                                     |
| ---------------- | --------------------------------------------------------- |
| Frontend         | Next.js 15, App Router, React, TailwindCSS, Radix UI      |
| Backend (API)    | Next.js Server Actions                                    |
| Storage & DB     | Appwrite (Databases + Storage)                            |
| Auth             | Appwrite Sessions (session + admin clients)               |
| UX Enhancements  | Debounced search, toast feedback, skeleton/loading states |
| Search/Sort      | Server-side filtering, URL parameter management           |
| State Management | use-debounce, Next.js searchParams, URL synchronization   |

## 🔄 Clients Strategy

| Client         | Purpose                                             |
| -------------- | --------------------------------------------------- |
| Session Client | User-scoped reads & identity (`account.get()`)      |
| Admin Client   | Elevated DB + storage operations (no account scope) |

Mixed where needed (e.g. sharing & delete: admin for DB + session for actor identity).

## ⚙️ Running Locally

```bash
npm install
npm run dev
# visit http://localhost:3000
```

Configure required Appwrite environment variables in `.env.local`:

```
NEXT_PUBLIC_APPWRITE_ENDPOINT=
NEXT_PUBLIC_APPWRITE_PROJECT=
APPWRITE_DATABASE_ID=
APPWRITE_USERS_COLLECTION_ID=
APPWRITE_FILES_COLLECTION_ID=
APPWRITE_BUCKET_ID=
APPWRITE_API_KEY=
```

## ✅ Reliability & Safety

- `withRetry` wrapper for transient failures
- Atomic operations with cleanup on partial failure
- Validations: ownership, duplicates, self‑share prevention, email format
- Query API: modern `Query.equal()` usage (no deprecated filters)

## 📦 File Document Shape

```ts
{
  name: string;
  type: string; // inferred category
  bucketField: string; // storage file ID
  accountId: string; // owner of this copy
  extension: string;
  size: number; // bytes
  $id: string;
}
```

## 🧪 Share Logic (Simplified)

```ts
// Pseudocode
if (targetUserAlreadyHasSame(bucketField, name)) abort;
createFileDoc({ bucketField, accountId: targetUserId });
appendToTargetUserFiles();
```

## 🗑️ Delete Logic (Simplified)

```ts
removeFileDocFromUser();
if (noOtherDocsReference(bucketField)) deleteStorageObject();
```

## 🔍 Real-Time Share Input

Debounced (500ms) email lookup → validates format → fetches user → enables Share button.

## 🔍 Search & Filter Experience

- **Instant Search**: 300ms debounced input for responsive filtering
- **Smart Sorting**: Default newest-first with 6 sorting options
- **URL Persistence**: Search terms and sort preferences saved in URL
- **Type Navigation**: Dedicated routes for each file category
- **Error Handling**: Graceful fallbacks for "no results" scenarios

## 🧭 Roadmap Ideas

- ~~Real-time search and sorting~~ ✅ **Completed**
- ~~Multiple file type support~~ ✅ **Completed**
- ~~URL state management~~ ✅ **Completed**
- Version history
- Multi-select bulk actions
- Preview for more document types
- Activity audit log
- Advanced file filters (size, date ranges)
- Drag & drop file upload

## 🙌 Credits

Built with Next.js & Appwrite. Designed for clarity, safety & user autonomy.

---

Focused, fast, and failure‑resilient. Store it once. Share it smart. ⚡
