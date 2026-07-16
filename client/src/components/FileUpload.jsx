import React, { useState } from 'react';
import { Upload, X, FileText, Image, Archive, Download, Eye, Loader, Trash2, CheckCircle, XCircle, Shield, Pencil, Check, X as XIcon } from 'lucide-react';
import { uploadFile, deleteFile, renameFile } from '../services/fileApi';
import api from '../services/api';
import toast from 'react-hot-toast';

const getFileIcon = (fileType) => {
  if (!fileType) return <FileText className="h-5 w-5" />;
  if (fileType.startsWith('image/')) return <Image className="h-5 w-5" />;
  if (fileType.includes('pdf')) return <FileText className="h-5 w-5" />;
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar'))
    return <Archive className="h-5 w-5" />;
  return <FileText className="h-5 w-5" />;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileUpload = ({ files, setFiles, projectId, taskId, userRole }) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const isLeader = userRole === 'project_leader';

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadFile(file, projectId, taskId);
      setFiles((prev) => [data, ...prev]);
      toast.success(`${file.name} uploaded`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await deleteFile(fileId);
      setFiles((prev) => prev.filter((f) => f._id !== fileId));
      toast.success('File deleted');
    } catch (err) {
      toast.error('Failed to delete file');
    }
  };

  const handleVerify = async (fileId, verified) => {
    setVerifyingId(fileId);
    try {
      const { data } = await api.patch(`/files/${fileId}/verify`, { verified });
      setFiles((prev) => prev.map((f) => (f._id === fileId ? data : f)));
      toast.success(verified ? 'File verified' : 'File rejected');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setVerifyingId(null);
    }
  };

  const startEdit = (file) => {
    setEditingId(file._id);
    setEditName(file.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveRename = async (fileId) => {
    if (!editName.trim()) return;
    try {
      const data = await renameFile(fileId, editName.trim());
      setFiles((prev) => prev.map((f) => (f._id === fileId ? data : f)));
      toast.success('File renamed');
      setEditingId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to rename');
    }
  };

  const canPreview = (file) => {
    if (!file.fileType) return false;
    return file.fileType.startsWith('image/') || file.fileType.includes('pdf');
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 cursor-pointer text-emerald-600 hover:text-emerald-700 text-xs font-semibold">
        <Upload className="h-4 w-4" />
        <span>Upload File</span>
        <input type="file" onChange={handleUpload} className="hidden" disabled={uploading} />
        {uploading && <Loader className="h-4 w-4 animate-spin text-slate-400" />}
      </label>

      {files.length === 0 && !uploading && (
        <p className="text-xs text-slate-400">No files attached.</p>
      )}

      <div className="space-y-2">
        {files.map((file) => (
          <div key={file._id}
            className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2"
          >
            <span className="text-slate-500">{getFileIcon(file.fileType)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                {editingId === file._id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 w-full min-w-0"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && saveRename(file._id)}
                    />
                    <button onClick={() => saveRename(file._id)} className="p-1 text-emerald-500 hover:text-emerald-600 shrink-0"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={cancelEdit} className="p-1 text-slate-400 hover:text-slate-500 shrink-0"><XIcon className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{file.name}</p>
                )}
                {file.verified ? (
                  <span className="shrink-0 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <CheckCircle className="h-3 w-3" /> Verified
                  </span>
                ) : isLeader ? (
                  <span className="shrink-0 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Shield className="h-3 w-3" /> Pending
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <XCircle className="h-3 w-3" /> Awaiting
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                {formatFileSize(file.size)}
                {file.uploadedBy?.name && ` · by ${file.uploadedBy.name}`}
                {file.verifiedBy?.name && ` · verified by ${file.verifiedBy.name}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {isLeader && !file.verified && (
                <>
                  <button onClick={() => handleVerify(file._id, true)} disabled={verifyingId === file._id}
                    className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/20 text-emerald-500"
                    title="Verify"
                  >
                    {verifyingId === file._id ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  </button>
                  <button onClick={() => handleVerify(file._id, false)} disabled={verifyingId === file._id}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400"
                    title="Reject"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </>
              )}
              {canPreview(file) && (
                <button onClick={() => setPreviewUrl(file.url)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                  title="Preview"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
              <a href={file.url} target="_blank" rel="noopener noreferrer"
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </a>
              <button onClick={() => startEdit(file)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                title="Rename"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(file._id)}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400 hover:text-red-600"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewUrl(null)}
              className="absolute -top-3 -right-3 p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 z-10"
            >
              <X className="h-5 w-5" />
            </button>
            {previewUrl.match(/\.(pdf)$/i) ? (
              <iframe src={previewUrl} className="w-full h-[80vh] rounded-2xl" title="Preview" />
            ) : (
              <img src={previewUrl} alt="Preview" className="max-h-[85vh] rounded-2xl shadow-2xl" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
