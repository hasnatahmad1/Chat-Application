import { X, Users } from 'lucide-react';
import './GroupInfoModal.css';

export default function GroupInfoModal({ group, onClose }) {
    if (!group) return null;

    // ✅ Handle different member structures (direct user object or nested in .user)
    const members = (group.members || []).map(m => m.user || m);

    // Get avatar URL for a member
    const getAvatarUrl = (member) => {
        if (member?.profile?.profile_image) {
            return member.profile.profile_image;
        }
        if (member?.profile_image) {
            return member.profile_image;
        }

        const firstName = member?.first_name || member?.username?.[0] || 'U';
        const lastName = member?.last_name || '';
        const initials = `${firstName[0]}${lastName[0] || ''}`;
        return `https://ui-avatars.com/api/?name=${initials}&background=667eea&color=fff`;
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose}></div>
            <div className="group-info-modal">
                {/* Header */}
                <div className="group-info-header">
                    <h2>Group Info</h2>
                    <button className="modal-close-btn" onClick={onClose} title="Close">
                        <X size={24} />
                    </button>
                </div>

                {/* Group Details */}
                <div className="group-info-content">
                    <div className="group-info-section">
                        <div className="group-icon">
                            <Users size={48} />
                        </div>
                        <h3 className="group-name">{group.name}</h3>
                        <p className="group-description">{group.description || 'No description'}</p>
                    </div>

                    {/* Members List */}
                    <div className="group-info-section">
                        <h4 className="section-title">
                            Members ({members.length})
                        </h4>
                        <div className="members-list">
                            {members.length === 0 ? (
                                <p className="no-members">No members found</p>
                            ) : (
                                members.map((member) => (
                                    <div key={member.id} className="member-item">
                                        <img
                                            src={getAvatarUrl(member)}
                                            alt={member.username || 'User'}
                                            className="member-avatar"
                                            onError={(e) => {
                                                const firstName = member?.first_name || member?.username || 'U';
                                                const lastName = member?.last_name || '';
                                                const initials = `${firstName[0]}${lastName[0] || ''}`;
                                                e.target.src = `https://ui-avatars.com/api/?name=${initials}&background=667eea&color=fff`;
                                            }}
                                        />
                                        <div className="member-info">
                                            <p className="member-name">
                                                {member.first_name ? `${member.first_name} ${member.last_name || ''}` : (member.username || 'Unknown User')}
                                            </p>
                                            <p className="member-username">@{member.username || 'unknown'}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
