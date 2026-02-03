'use client';

import { useState, useEffect } from 'react';
import { useMemory, Memory } from '@/contexts/MemoryContext';
import { useNotify } from '@/features/ui/Notifications';
import { 
  Share2, 
  Users, 
  Lock, 
  Unlock, 
  X,
  CheckCircle,
  AlertCircle,
  Copy,
  Clock,
  Shield,
  Eye,
  EyeOff,
  Link,
  Trash2,
  Plus
} from 'lucide-react';

interface AccessGrant {
  id: string;
  memoryId: string;
  grantee: string;
  granteeName: string;
  permission: 'read' | 'write' | 'admin';
  grantedAt: Date;
  expiresAt?: Date;
  status: 'active' | 'revoked' | 'expired';
}

interface ShareLink {
  id: string;
  memoryId: string;
  token: string;
  permission: 'read' | 'write';
  createdAt: Date;
  expiresAt?: Date;
  accessCount: number;
  maxAccesses?: number;
}

export function MemorySharing() {
  const { memories, filteredMemories } = useMemory();
  const notify = useNotify();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'share' | 'manage' | 'links'>('share');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [granteeAddress, setGranteeAddress] = useState('');
  const [granteeName, setGranteeName] = useState('');
  const [permission, setPermission] = useState<'read' | 'write' | 'admin'>('read');
  const [expiryDays, setExpiryDays] = useState<number | ''>('');
  const [accessGrants, setAccessGrants] = useState<AccessGrant[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Load mock data
  useEffect(() => {
    const mockGrants: AccessGrant[] = [
      {
        id: 'grant_001',
        memoryId: memories[0]?.id || '',
        grantee: '8x7R3...9k2M',
        granteeName: 'Alpha Team',
        permission: 'read',
        grantedAt: new Date(Date.now() - 86400000 * 5),
        status: 'active',
      },
      {
        id: 'grant_002',
        memoryId: memories[1]?.id || '',
        grantee: '3n5P9...7j4K',
        granteeName: 'Beta Agent',
        permission: 'write',
        grantedAt: new Date(Date.now() - 86400000 * 2),
        expiresAt: new Date(Date.now() + 86400000 * 5),
        status: 'active',
      },
    ];
    setAccessGrants(mockGrants);
  }, [memories]);

  const handleShare = () => {
    if (!selectedMemory || !granteeAddress.trim()) {
      notify.error('Missing Information', 'Please select a memory and enter a grantee address');
      return;
    }

    const newGrant: AccessGrant = {
      id: `grant_${Date.now()}`,
      memoryId: selectedMemory.id,
      grantee: granteeAddress,
      granteeName: granteeName || 'Unnamed User',
      permission,
      grantedAt: new Date(),
      expiresAt: expiryDays ? new Date(Date.now() + Number(expiryDays) * 86400000) : undefined,
      status: 'active',
    };

    setAccessGrants(prev => [newGrant, ...prev]);
    notify.success('Access Granted', `Shared "${selectedMemory.key}" with ${newGrant.granteeName}`);
    
    // Reset form
    setGranteeAddress('');
    setGranteeName('');
    setSelectedMemory(null);
    setExpiryDays('');
  };

  const handleCreateLink = () => {
    if (!selectedMemory) {
      notify.error('No Memory Selected', 'Please select a memory to share');
      return;
    }

    const token = `am_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const newLink: ShareLink = {
      id: `link_${Date.now()}`,
      memoryId: selectedMemory.id,
      token,
      permission: 'read',
      createdAt: new Date(),
      expiresAt: expiryDays ? new Date(Date.now() + Number(expiryDays) * 86400000) : undefined,
      accessCount: 0,
    };

    setShareLinks(prev => [newLink, ...prev]);
    notify.success('Share Link Created', 'Link generated successfully');
    setSelectedMemory(null);
  };

  const handleRevokeGrant = (grantId: string) => {
    setAccessGrants(prev => prev.map(g => 
      g.id === grantId ? { ...g, status: 'revoked' as const } : g
    ));
    notify.info('Access Revoked', 'The grant has been revoked');
  };

  const handleDeleteLink = (linkId: string) => {
    setShareLinks(prev => prev.filter(l => l.id !== linkId));
    notify.info('Link Deleted', 'Share link has been deleted');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    notify.success('Copied', 'Link copied to clipboard');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-40 z-40 w-12 h-12 border border-[#4ade80] bg-[#0a0a0a] flex items-center justify-center hover:bg-[#4ade80] hover:text-[#0a0a0a] transition-all group"
        title="Memory Sharing"
      >
        <Share2 className="w-5 h-5 text-[#4ade80] group-hover:text-[#0a0a0a]" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="retro-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#222] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border border-[#4ade80] flex items-center justify-center glow-green">
              <Share2 className="w-5 h-5 text-[#4ade80]" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white tracking-wider">MEMORY_SHARING</h3>
              <p className="text-xs text-[#666] font-mono">GRANT_ACCESS // MANAGE_PERMISSIONS</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-[#666] hover:text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#222]">
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 px-4 py-3 text-xs font-mono tracking-wider flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'share'
                ? 'bg-[#4ade80]/10 text-[#4ade80] border-b-2 border-[#4ade80]'
                : 'text-[#666] hover:text-[#888] hover:bg-[#111]'
            }`}
          >
            <Plus className="w-4 h-4" />
            NEW_SHARE
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 px-4 py-3 text-xs font-mono tracking-wider flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'manage'
                ? 'bg-[#00d4ff]/10 text-[#00d4ff] border-b-2 border-[#00d4ff]'
                : 'text-[#666] hover:text-[#888] hover:bg-[#111]'
            }`}
          >
            <Users className="w-4 h-4" />
            ACCESS_GRANTS ({accessGrants.filter(g => g.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`flex-1 px-4 py-3 text-xs font-mono tracking-wider flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'links'
                ? 'bg-[#ff6b35]/10 text-[#ff6b35] border-b-2 border-[#ff6b35]'
                : 'text-[#666] hover:text-[#888] hover:bg-[#111]'
            }`}
          >
            <Link className="w-4 h-4" />
            SHARE_LINKS ({shareLinks.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'share' && (
            <div className="space-y-6">
              {/* Select Memory */}
              <div>
                <label className="text-xs text-[#666] font-mono tracking-wider flex items-center gap-2 mb-3">
                  <Shield className="w-3 h-3" />
                  SELECT_MEMORY
                </label>
                <div className="border border-[#222] max-h-40 overflow-y-auto">
                  {memories.map((memory) => (
                    <button
                      key={memory.id}
                      onClick={() => setSelectedMemory(memory)}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                        selectedMemory?.id === memory.id
                          ? 'bg-[#4ade80]/10 border-l-2 border-[#4ade80]'
                          : 'hover:bg-[#111] border-l-2 border-transparent'
                      }`}
                    >
                      {selectedMemory?.id === memory.id ? (
                        <CheckCircle className="w-4 h-4 text-[#4ade80]" />
                      ) : (
                        <div className="w-4 h-4 border border-[#444]" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-[#888] font-mono truncate block">{memory.key}</span>
                        <span className="text-xs text-[#666]">{memory.type}</span>
                      </div>
                    </button>
                  ))}
                </div>
                {selectedMemory && (
                  <div className="mt-2 p-3 bg-[#4ade80]/5 border border-[#4ade80]/20">
                    <span className="text-xs text-[#666] font-mono">SELECTED: </span>
                    <span className="text-sm text-[#4ade80] font-mono">{selectedMemory.key}</span>
                  </div>
                )}
              </div>

              {/* Grantee Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#666] font-mono tracking-wider mb-2 block">
                    GRANTEE_ADDRESS *
                  </label>
                  <input
                    type="text"
                    value={granteeAddress}
                    onChange={(e) => setGranteeAddress(e.target.value)}
                    placeholder="0x... or wallet address"
                    className="w-full px-4 py-3 bg-[#111] border border-[#333] text-white placeholder-[#555] focus:border-[#4ade80] focus:outline-none font-mono text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#666] font-mono tracking-wider mb-2 block">
                    GRANTEE_NAME
                  </label>
                  <input
                    type="text"
                    value={granteeName}
                    onChange={(e) => setGranteeName(e.target.value)}
                    placeholder="Optional name"
                    className="w-full px-4 py-3 bg-[#111] border border-[#333] text-white placeholder-[#555] focus:border-[#4ade80] focus:outline-none font-mono text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Permission Level */}
              <div>
                <label className="text-xs text-[#666] font-mono tracking-wider mb-3 block">
                  PERMISSION_LEVEL
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['read', 'write', 'admin'] as const).map((perm) => (
                    <button
                      key={perm}
                      onClick={() => setPermission(perm)}
                      className={`px-4 py-3 border text-sm font-mono transition-colors flex items-center justify-center gap-2 ${
                        permission === perm
                          ? 'border-[#4ade80] text-[#4ade80] bg-[#4ade80]/10'
                          : 'border-[#333] text-[#666] hover:border-[#555]'
                      }`}
                    >
                      {perm === 'read' && <Eye className="w-4 h-4" />}
                      {perm === 'write' && <Unlock className="w-4 h-4" />}
                      {perm === 'admin' && <Shield className="w-4 h-4" />}
                      {perm.toUpperCase()}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-[#666]">
                  {permission === 'read' && 'Grantee can view the memory content'}
                  {permission === 'write' && 'Grantee can view and modify the memory'}
                  {permission === 'admin' && 'Grantee has full control including deletion'}
                </p>
              </div>

              {/* Expiry */}
              <div>
                <label className="text-xs text-[#666] font-mono tracking-wider mb-2 block">
                  EXPIRES_AFTER (days, optional)
                </label>
                <input
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="Never expires"
                  min="1"
                  max="365"
                  className="w-full px-4 py-3 bg-[#111] border border-[#333] text-white placeholder-[#555] focus:border-[#4ade80] focus:outline-none font-mono text-sm transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleShare}
                  disabled={!selectedMemory || !granteeAddress.trim()}
                  className="flex-1 py-3 border border-[#4ade80] text-[#4ade80] hover:bg-[#4ade80] hover:text-[#0a0a0a] disabled:border-[#333] disabled:text-[#555] disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all font-mono text-sm tracking-wider flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  GRANT_ACCESS
                </button>
                <button
                  onClick={handleCreateLink}
                  disabled={!selectedMemory}
                  className="flex-1 py-3 border border-[#ff6b35] text-[#ff6b35] hover:bg-[#ff6b35] hover:text-[#0a0a0a] disabled:border-[#333] disabled:text-[#555] transition-all font-mono text-sm tracking-wider flex items-center justify-center gap-2"
                >
                  <Link className="w-4 h-4" />
                  CREATE_LINK
                </button>
              </div>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-4">
              {accessGrants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-[#444] mx-auto mb-4" />
                  <p className="text-[#666] font-mono">NO_ACCESS_GRANTS</p>
                  <p className="text-xs text-[#555] mt-2">Share memories to see grants here</p>
                </div>
              ) : (
                accessGrants.map((grant) => {
                  const memory = memories.find(m => m.id === grant.memoryId);
                  return (
                    <div 
                      key={grant.id} 
                      className={`border p-4 transition-colors ${
                        grant.status === 'active' 
                          ? 'border-[#333] hover:border-[#4ade80]' 
                          : 'border-[#222] opacity-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm text-white font-mono">{grant.granteeName}</span>
                            <span className="text-xs text-[#666] font-mono">{grant.grantee}</span>
                            <span className={`text-[10px] px-2 py-0.5 border ${
                              grant.permission === 'admin' ? 'border-[#ff4444] text-[#ff4444]' :
                              grant.permission === 'write' ? 'border-[#ff6b35] text-[#ff6b35]' :
                              'border-[#00d4ff] text-[#00d4ff]'
                            }`}>
                              {grant.permission.toUpperCase()}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 border ${
                              grant.status === 'active' ? 'border-[#4ade80] text-[#4ade80]' :
                              grant.status === 'revoked' ? 'border-[#ff4444] text-[#ff4444]' :
                              'border-[#fbbf24] text-[#fbbf24]'
                            }`}>
                              {grant.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs text-[#666] font-mono mb-2">
                            Memory: {memory?.key || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-[#555]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Granted: {formatDate(grant.grantedAt)}
                            </span>
                            {grant.expiresAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Expires: {formatDate(grant.expiresAt)}
                              </span>
                            )}
                          </div>
                        </div>
                        {grant.status === 'active' && (
                          <button
                            onClick={() => handleRevokeGrant(grant.id)}
                            className="p-2 text-[#666] hover:text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'links' && (
            <div className="space-y-4">
              {shareLinks.length === 0 ? (
                <div className="text-center py-12">
                  <Link className="w-12 h-12 text-[#444] mx-auto mb-4" />
                  <p className="text-[#666] font-mono">NO_SHARE_LINKS</p>
                  <p className="text-xs text-[#555] mt-2">Create share links to see them here</p>
                </div>
              ) : (
                shareLinks.map((link) => {
                  const memory = memories.find(m => m.id === link.memoryId);
                  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${link.token}`;
                  
                  return (
                    <div 
                      key={link.id} 
                      className="border border-[#333] p-4 hover:border-[#ff6b35] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-sm text-white font-mono">{memory?.key || 'Unknown Memory'}</span>
                          <span className="text-xs text-[#666] font-mono ml-2">({link.permission})</span>
                        </div>
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="p-2 text-[#666] hover:text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="bg-[#0a0a0a] border border-[#222] p-3 flex items-center gap-3">
                        <code className="flex-1 text-xs text-[#888] font-mono truncate">{shareUrl}</code>
                        <button
                          onClick={() => copyToClipboard(shareUrl, link.id)}
                          className="p-2 text-[#666] hover:text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-colors"
                        >
                          {copiedToken === link.id ? (
                            <CheckCircle className="w-4 h-4 text-[#4ade80]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-[#555]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Created: {formatDate(link.createdAt)}
                        </span>
                        {link.expiresAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expires: {formatDate(link.expiresAt)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Accessed: {link.accessCount} times
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
