/// <reference types="cypress" />
import { adminScreen } from '../screens/admin.screen';
import {
	buildLeaderboardSnapshot,
	buildRoundCreated,
	buildTagListSnapshot
} from '../support/event-builders';

describe('Admin Dashboard', () => {
	const subjectId = 'club-123';
	const guildId = 'guild-123';

	const profiles = {
		'user-1': {
			user_id: 'user-1',
			display_name: 'Player One',
			avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
		},
		'user-2': {
			user_id: 'user-2',
			display_name: 'Player Two',
			avatar_url: 'https://cdn.discordapp.com/embed/avatars/1.png'
		}
	};

	function arrangeBaseSnapshot() {
		cy.arrangeSnapshot({
			subjectId,
			rounds: [
				buildRoundCreated({
					id: 'round-admin-1',
					guild_id: guildId,
					title: 'Admin Round',
					participants: []
				})
			],
			leaderboard: buildLeaderboardSnapshot({
				guild_id: guildId,
				leaderboard: [
					{ user_id: 'user-1', tag_number: 1, total_points: 500, rounds_played: 8 },
					{ user_id: 'user-2', tag_number: 2, total_points: 450, rounds_played: 7 }
				]
			}),
			tags: buildTagListSnapshot({
				guild_id: guildId,
				members: [
					{ member_id: 'user-1', current_tag: 1 },
					{ member_id: 'user-2', current_tag: 2 }
				]
			}),
			profiles
		});
	}

	function visitAdmin(role: 'viewer' | 'player' | 'editor' | 'admin' = 'admin') {
		arrangeBaseSnapshot();
		cy.arrangeAuth({
			path: '/admin',
			clubUuid: subjectId,
			guildId,
			role,
			linkedProviders: ['discord']
		});
		cy.wsConnect();
	}

	it('redirects non-admin users away from /admin', () => {
		visitAdmin('player');

		cy.location('pathname').should('eq', '/');
		cy.expectDashboardLoaded();
	});

	it('renders admin dashboard sections for admin users', () => {
		visitAdmin('admin');

		adminScreen.root().should('be.visible');
		adminScreen.tagSection().should('contain', 'Submit Batch');
		adminScreen.pointSection().should('contain', 'Adjust Points');
	});

	it('blocks batch submit when duplicate target tags create conflicts', () => {
		visitAdmin('admin');

		adminScreen.setTagForPlayer('Player One', '7');
		adminScreen.setTagForPlayer('Player Two', '7');

		cy.contains('#7 is already assigned to another row').should('be.visible');
		adminScreen.submitBatchButton().should('be.disabled');
	});

	it('submits tag batch and handles success events', () => {
		visitAdmin('admin');

		adminScreen.setTagForPlayer('Player One', '3');
		adminScreen.submitBatchButton().click();

		cy.wsAssertPublished('leaderboard.batch.tag.assignment.requested.v2').then((entries) => {
			const lastEntry = entries[entries.length - 1];
			const payload = lastEntry.payload as {
				batch_id: string;
				requesting_user_id: string;
				guild_id: string;
			};

			cy.wsEmit('leaderboard.batch.tag.assigned.v2', {
				assignment_count: 1,
				batch_id: payload.batch_id,
				guild_id: payload.guild_id,
				requesting_user_id: payload.requesting_user_id,
				assignments: [
					{
						guild_id: payload.guild_id,
						user_id: 'user-1',
						tag_number: 3
					}
				]
			});
		});

		cy.contains('Tags updated successfully').should('be.visible');
	});

	it('shows tag batch failure messages from backend events', () => {
		visitAdmin('admin');

		adminScreen.setTagForPlayer('Player Two', '4');
		adminScreen.submitBatchButton().click();

		cy.wsAssertPublished('leaderboard.batch.tag.assignment.requested.v2').then((entries) => {
			const lastEntry = entries[entries.length - 1];
			const payload = lastEntry.payload as {
				batch_id: string;
				requesting_user_id: string;
				guild_id: string;
			};

			cy.wsEmit('leaderboard.batch.tag.assignment.failed.v2', {
				batch_id: payload.batch_id,
				guild_id: payload.guild_id,
				requesting_user_id: payload.requesting_user_id,
				reason: 'Tag number reserved'
			});
		});

		cy.contains('Tag number reserved').should('be.visible');
	});

	it('enforces point adjustment form validation before submission', () => {
		visitAdmin('admin');

		adminScreen.adjustPointsButton().should('be.disabled');
		adminScreen.pointMemberSelect().select('user-1');
		adminScreen.pointDeltaInput().type('0');
		adminScreen.pointReasonInput().type('Manual correction');
		adminScreen.adjustPointsButton().should('be.disabled');
		cy.contains('Delta cannot be zero').should('be.visible');

		adminScreen.pointDeltaInput().clear().type('10');
		adminScreen.adjustPointsButton().should('not.be.disabled');
	});

	it('submits manual point adjustment and handles success events', () => {
		visitAdmin('admin');

		adminScreen.pointMemberSelect().select('user-2');
		adminScreen.pointDeltaInput().type('15');
		adminScreen.pointReasonInput().type('Bonus points');
		adminScreen.adjustPointsButton().click();

		cy.wsAssertPublished('leaderboard.manual.point.adjustment.v2').then((entries) => {
			const lastEntry = entries[entries.length - 1];
			const payload = lastEntry.payload as {
				guild_id: string;
				member_id: string;
				points_delta: number;
				reason: string;
			};

			expect(payload.guild_id).to.eq(guildId);
			expect(payload.guild_id).not.to.eq(subjectId);

			cy.wsEmit('leaderboard.manual.point.adjustment.success.v2', {
				guild_id: payload.guild_id,
				member_id: payload.member_id,
				points_delta: payload.points_delta,
				reason: payload.reason
			});
		});

		cy.contains('Points adjusted: +15').should('be.visible');
	});

	it('shows manual point adjustment failures from backend events', () => {
		visitAdmin('admin');

		adminScreen.pointMemberSelect().select('user-1');
		adminScreen.pointDeltaInput().type('-5');
		adminScreen.pointReasonInput().type('Penalty');
		adminScreen.adjustPointsButton().click();

		cy.wsAssertPublished('leaderboard.manual.point.adjustment.v2').then((entries) => {
			const lastEntry = entries[entries.length - 1];
			const payload = lastEntry.payload as { guild_id: string };

			expect(payload.guild_id).to.eq(guildId);
			expect(payload.guild_id).not.to.eq(subjectId);

			cy.wsEmit('leaderboard.manual.point.adjustment.failed.v2', {
				guild_id: payload.guild_id,
				reason: 'Only admins can adjust points'
			});
		});

		cy.contains('Only admins can adjust points').should('be.visible');
	});

	it('submits admin scorecard upload with overwrite + guest fallback flags', () => {
		visitAdmin('admin');

		const manualRoundId = '1bd0d342-19ef-4d25-b6a7-b537e523fb34';
		cy.get('#admin-scorecard-round-id').type(manualRoundId);
		cy.get('#admin-scorecard-notes').type('Imported from admin dashboard');
		cy.get('#admin-scorecard-file').selectFile({
			contents: Cypress.Buffer.from('Player,+/-\nAlec,-2\n'),
			fileName: 'scores.csv',
			mimeType: 'text/csv'
		});
		cy.contains('button', 'Upload Scorecard').click();

		cy.wsAssertPublished('round.scorecard.admin.upload.requested.v2').then((entries) => {
			const lastEntry = entries[entries.length - 1];
			const payload = lastEntry.payload as {
				guild_id: string;
				round_id: string;
				user_id: string;
				file_name: string;
				source: string;
				allow_guest_players: boolean;
				overwrite_existing_scores: boolean;
				notes: string;
			};

			expect(payload.guild_id).to.eq(guildId);
			expect(payload.guild_id).not.to.eq(subjectId);
			expect(payload.round_id).to.eq(manualRoundId);
			expect(payload.file_name).to.eq('scores.csv');
			expect(payload.source).to.eq('admin_pwa_upload');
			expect(payload.allow_guest_players).to.eq(true);
			expect(payload.overwrite_existing_scores).to.eq(true);
			expect(payload.notes).to.eq('Imported from admin dashboard');
		});
	});

	it('uses the Discord guild ID for backfill check and submit when club UUID differs', () => {
		visitAdmin('admin');

		cy.wsStubRequest(
			'round.admin.backfill.check.v1',
			{ subsequent_round_count: 0, round_titles: [] },
			{ validate: false }
		);
		cy.wsStubRequest(
			'round.admin.backfill.requested.v1',
			{ round_id: 'round-backfill-1' },
			{ validate: false }
		);

		cy.get('#backfill-title').type('Historic Round');
		cy.get('#backfill-location').type('Pier Park');
		cy.get('#backfill-date').type('2025-03-08T15:30');
		cy.wait(700);

		cy.wsAssertPublished('round.admin.backfill.check.v1').then((entries) => {
			const lastEntry = entries[entries.length - 1];
			const payload = lastEntry.payload as {
				guild_id: string;
				admin_id: string;
				start_time: string;
			};

			expect(payload.guild_id).to.eq(guildId);
			expect(payload.guild_id).not.to.eq(subjectId);
			expect(payload.admin_id).to.eq('user-1');
			expect(payload.start_time).to.contain('2025-03-08T');
		});

		cy.get('#backfill-file').selectFile({
			contents: Cypress.Buffer.from('Player,+/-\nAlec,-2\n'),
			fileName: 'historic-round.csv',
			mimeType: 'text/csv'
		});
		cy.contains('button', 'Submit Backfill Round').click();

		cy.wsAssertPublished('round.admin.backfill.requested.v1').then((entries) => {
			const lastEntry = entries[entries.length - 1];
			const payload = lastEntry.payload as {
				guild_id: string;
				admin_id: string;
				title: string;
				location: string;
				file_name: string;
			};

			expect(payload.guild_id).to.eq(guildId);
			expect(payload.guild_id).not.to.eq(subjectId);
			expect(payload.admin_id).to.eq('user-1');
			expect(payload.title).to.eq('Historic Round');
			expect(payload.location).to.eq('Pier Park');
			expect(payload.file_name).to.eq('historic-round.csv');
		});
	});
});
