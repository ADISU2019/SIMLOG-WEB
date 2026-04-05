// FANTAYE PLATFORMS
// Phase 3B – Document Upload (per Shipment)
// Version: v3.4.0
// Date: 2026-02-18

"use client";

import { useState, useEffect } from "react";
import { storage, db, auth } from "../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, serverTimestamp, collection, getDocs, query, orderBy, updateDoc } from "firebase/firestore";

const DOC_TYPES = [
  "Bill of Lading",
  "Commercial Invoice",
  "Packing List",
  "Certificate of Origin",
  "Permit",
  "Airway Bill",
  "Other"
];

export default function DocumentUpload({
  shipmentId,
  onUploadSuccess, // optional callback from parent
}: {
  shipmentId: string;
  onUploadSuccess?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const uploadFile = async () => {
    if (!file) {
      alert("Select a file first");
      return;
    }

    try {
      setUploading(true);
      const uid = auth.currentUser?.uid || "unknown";

      // 1️⃣ Storage reference
      const storageRef = ref(storage, `shipments/${shipmentId}/${file.name}`);

      // 2️⃣ Upload file
      await uploadBytes(storageRef, file);

      // 3️⃣ Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // 4️⃣ Save metadata in Firestore
      const docRef = doc(db, "shipments", shipmentId, "documents", file.name);
      await setDoc(docRef, {
        fileName: file.name,
        docType,
        url: downloadURL,
        uploadedAt: serverTimestamp(),
        uploadedBy: uid
      });

      alert("Document uploaded successfully");
      setFile(null);

      // ✅ Auto-update shipment status to DOCUMENTS_UPLOADED
      const shipmentRef = doc(db, "shipments", shipmentId);
      await updateDoc(shipmentRef, { status: "DOCUMENTS_UPLOADED" });

      // ✅ Trigger optional parent callback
      if (onUploadSuccess) onUploadSuccess();

      // Refresh upload history
      fetchHistory();

    } catch (error) {
      console.error(error);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Fetch document history for this shipment
  const fetchHistory = async () => {
    const q = query(collection(db, "shipments", shipmentId, "documents"), orderBy("uploadedAt", "desc"));
    const snap = await getDocs(q);
    setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchHistory();
  }, [shipmentId]);

  return (
    <div className="bg-white p-6 rounded-xl shadow mb-6">
      <h2 className="text-xl font-bold mb-4">
        Upload Documents (Shipment {shipmentId})
      </h2>

      <select
        className="border p-2 w-full mb-2"
        value={docType}
        onChange={e => setDocType(e.target.value)}
      >
        {DOC_TYPES.map(dt => (
          <option key={dt} value={dt}>{dt}</option>
        ))}
      </select>

      <input
        type="file"
        onChange={e => setFile(e.target.files?.[0] || null)}
        className="mb-4"
      />

      <button
        onClick={uploadFile}
        disabled={uploading}
        className="bg-green-700 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {/* Upload history */}
      {history.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Uploaded Documents</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            {history.map(h => (
              <li key={h.id}>
                <strong>{h.docType}</strong>: <a href={h.url} target="_blank" rel="noreferrer">{h.fileName}</a> by {h.uploadedBy}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 