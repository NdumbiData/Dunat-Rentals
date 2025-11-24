'use client';

import { useState, useEffect } from 'react';
import { createDocument, getDocuments, deleteDocument } from '@/app/actions/documents';
import { AssetDocument } from '@prisma/client';

interface AssetDocumentsProps {
    carId: string;
}

export default function AssetDocuments({ carId }: AssetDocumentsProps) {
    const [documents, setDocuments] = useState<AssetDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // Form State
    const [type, setType] = useState('Insurance');
    const [expiryDate, setExpiryDate] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [notes, setNotes] = useState('');

    const fetchDocs = async () => {
        const docs = await getDocuments(carId);
        setDocuments(docs);
        setLoading(false);
    };

    useEffect(() => {
        fetchDocs();
    }, [carId]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return alert("Please select a file");

        setIsUploading(true);
        const formData = new FormData();
        formData.append('carId', carId);
        formData.append('type', type);
        formData.append('expiryDate', expiryDate);
        formData.append('file', file);
        formData.append('notes', notes);

        const result = await createDocument(formData);
        if (result.success) {
            alert("Document uploaded!");
            setFile(null);
            setNotes('');
            setExpiryDate('');
            fetchDocs();
        } else {
            alert(result.message);
        }
        setIsUploading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        await deleteDocument(id);
        fetchDocs();
    };

    if (loading) return <div>Loading documents...</div>;

    return (
        <div className="space-y-6">
            {/* Upload Form */}
            <div className="card bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-semibold mb-3 text-sm uppercase text-slate-500">Add New Document</h4>
                <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Type</label>
                        <select className="input" value={type} onChange={e => setType(e.target.value)}>
                            <option value="Insurance">Insurance</option>
                            <option value="Inspection">Inspection</option>
                            <option value="Logbook">Logbook</option>
                            <option value="Permit">Permit</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Expiry Date</label>
                        <input
                            type="date"
                            className="input"
                            value={expiryDate}
                            onChange={e => setExpiryDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="label">File</label>
                        <input
                            type="file"
                            className="input"
                            onChange={e => setFile(e.target.files?.[0] || null)}
                            accept=".pdf,.jpg,.png,.jpeg"
                        />
                    </div>
                    <div>
                        <label className="label">Notes</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Optional notes"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <button type="submit" className="btn btn-primary w-full" disabled={isUploading}>
                            {isUploading ? 'Uploading...' : 'Upload Document'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Documents List */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-sm">
                            <th className="p-3">Type</th>
                            <th className="p-3">Expiry</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Notes</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-slate-400">No documents found.</td>
                            </tr>
                        ) : (
                            documents.map(doc => {
                                const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                                const isExpiringSoon = doc.expiryDate &&
                                    new Date(doc.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
                                    !isExpired;

                                return (
                                    <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-3 font-medium">{doc.type}</td>
                                        <td className="p-3">
                                            {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="p-3">
                                            {isExpired && <span className="badge badge-error">Expired</span>}
                                            {isExpiringSoon && <span className="badge badge-warning">Expiring Soon</span>}
                                            {!isExpired && !isExpiringSoon && <span className="badge badge-success">Valid</span>}
                                        </td>
                                        <td className="p-3 text-sm text-slate-600">{doc.notes || '-'}</td>
                                        <td className="p-3 text-right space-x-2">
                                            {doc.fileUrl && (
                                                <a
                                                    href={doc.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-sm"
                                                >
                                                    View
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
