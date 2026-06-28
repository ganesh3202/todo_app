import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Sun, Moon, Save, Shield, Palette } from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', bio: user?.bio || '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      const res = await authAPI.updateProfile(profileForm);
      updateUser(res.user);
      toast.success('Profile updated!');
    } catch (e) { toast.error(e.message); }
    setSavingProfile(false);
  };

  const handlePassChange = async () => {
    if (!passForm.currentPassword || !passForm.newPassword) return toast.error('Fill all fields');
    if (passForm.newPassword !== passForm.confirm) return toast.error('Passwords do not match');
    if (passForm.newPassword.length < 6) return toast.error('Password must be 6+ characters');
    setSavingPass(true);
    try {
      await authAPI.changePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed!');
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (e) { toast.error(e.message); }
    setSavingPass(false);
  };

  return (
    <div className="profile-page page-enter">
      {/* Header card */}
      <div className="profile-hero glass-card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {user?.avatar ? <img src={user.avatar} alt="" /> : <span>{user?.name?.charAt(0).toUpperCase()}</span>}
          </div>
          <div className="profile-avatar-ring" />
        </div>
        <div className="profile-hero-info">
          <h2 className="profile-name">{user?.name}</h2>
          <p className="profile-email"><Mail size={14} /> {user?.email}</p>
          <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent-primary)' }}>
            <Shield size={10} /> {user?.role}
          </span>
        </div>
        <div className="profile-hero-stats">
          <div className="p-stat">
            <div className="p-stat-val">—</div>
            <div className="p-stat-label">Tasks Done</div>
          </div>
          <div className="p-stat">
            <div className="p-stat-val">—</div>
            <div className="p-stat-label">Projects</div>
          </div>
          <div className="p-stat">
            <div className="p-stat-val">—</div>
            <div className="p-stat-label">Notes</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'security', label: 'Security', icon: Lock },
          { id: 'appearance', label: 'Appearance', icon: Palette },
        ].map(tab => (
          <button key={tab.id} className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && (
        <div className="profile-section glass-card animate-fade-in">
          <h3 className="section-header-title">Profile Information</h3>
          <div className="form-group">
            <label className="label">Full Name</label>
            <input className="input-field" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Email (read-only)</label>
            <input className="input-field" value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
          </div>
          <div className="form-group">
            <label className="label">Bio</label>
            <textarea className="input-field" rows={4} placeholder="Tell us about yourself..." value={profileForm.bio}
              onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} />
          </div>
          <button className="btn btn-primary" onClick={handleProfileSave} disabled={savingProfile}>
            {savingProfile ? <><div className="spinner" /> Saving...</> : <><Save size={16} /> Save Profile</>}
          </button>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="profile-section glass-card animate-fade-in">
          <h3 className="section-header-title">Change Password</h3>
          <div className="form-group">
            <label className="label">Current Password</label>
            <input type="password" className="input-field" value={passForm.currentPassword}
              onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">New Password</label>
            <input type="password" className="input-field" value={passForm.newPassword}
              onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Confirm New Password</label>
            <input type="password" className="input-field" value={passForm.confirm}
              onChange={e => setPassForm({ ...passForm, confirm: e.target.value })} />
          </div>
          <button className="btn btn-primary" onClick={handlePassChange} disabled={savingPass}>
            {savingPass ? <><div className="spinner" /> Updating...</> : <><Lock size={16} /> Change Password</>}
          </button>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div className="profile-section glass-card animate-fade-in">
          <h3 className="section-header-title">Appearance</h3>
          <div className="theme-toggle-section">
            <div className="theme-option" onClick={toggleTheme}>
              <div className={`theme-preview dark-preview ${theme === 'dark' ? 'selected' : ''}`}>
                <Moon size={24} />
                <span>Dark Mode</span>
                {theme === 'dark' && <div className="theme-check">✓</div>}
              </div>
            </div>
            <div className="theme-option" onClick={toggleTheme}>
              <div className={`theme-preview light-preview ${theme === 'light' ? 'selected' : ''}`}>
                <Sun size={24} />
                <span>Light Mode</span>
                {theme === 'light' && <div className="theme-check">✓</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
