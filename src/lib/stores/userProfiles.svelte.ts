/**
 * User Profile Store
 * Caches user profile data for display across the app
 */

// Raw API format (matches backend)
export interface UserProfileRaw {
    user_id: string;
    display_name: string;
    avatar_url: string;
    udisc_username?: string;
}

// Internal format
export interface UserProfile {
    userId: string;
    displayName: string;
    avatarUrl: string;
    udiscUsername?: string;
}

function transformProfile(raw: UserProfileRaw): UserProfile {
    return {
        userId: raw.user_id,
        displayName: raw.display_name,
        avatarUrl: raw.avatar_url,
        udiscUsername: raw.udisc_username
    };
}

class UserProfileService {
    profiles = $state<Record<string, UserProfile>>({});

    /**
     * Add profiles from API response
     */
    setProfilesFromApi(rawProfiles: Record<string, UserProfileRaw>): void {
        const transformed: Record<string, UserProfile> = {};
        for (const [key, raw] of Object.entries(rawProfiles)) {
            transformed[key] = transformProfile(raw);
        }
        // Merge with existing profiles
        this.profiles = { ...this.profiles, ...transformed };
    }

    /**
     * Get profile for a user ID
     */
    getProfile(userId: string): UserProfile | undefined {
        return this.profiles[userId];
    }

    /**
     * Get display name with fallback
     */
    getDisplayName(userId: string): string {
        const profile = this.profiles[userId];
        if (profile?.udiscUsername) {
            return profile.udiscUsername;
        }
        if (profile?.displayName) {
            return profile.displayName;
        }
        // Fallback to truncated user ID
        if (userId.length > 6) {
            return `User ...${userId.slice(-6)}`;
        }
        return `User ${userId}`;
    }

    /**
     * Get avatar URL with fallback to Discord default
     */
    getAvatarUrl(userId: string): string {
        const profile = this.profiles[userId];
        if (profile?.avatarUrl) {
            return profile.avatarUrl;
        }
        // Generate default Discord avatar
        return this.getDefaultAvatarUrl(userId);
    }

    private getDefaultAvatarUrl(userId: string): string {
        try {
            const index = Number((BigInt(userId) >> 22n) % 6n);
            return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
        } catch {
            return 'https://cdn.discordapp.com/embed/avatars/0.png';
        }
    }

    /**
     * Clear all cached profiles
     */
    clear(): void {
        this.profiles = {};
    }
}

export const userProfiles = new UserProfileService();
