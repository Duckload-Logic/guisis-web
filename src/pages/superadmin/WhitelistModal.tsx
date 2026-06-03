import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Checkbox from "@/components/form/Checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface WhitelistModalProps {
	isOpen: boolean;
	onClose: () => void;
	onWhitelist: (email: string, roleIds: number[]) => Promise<void>;
	isProcessing: boolean;
	initialEmail?: string;
	initialRoleIds?: number[];
}

const AVAILABLE_ROLES = [
	{ id: 1, name: "Student" },
	{ id: 2, name: "Counselor" },
	{ id: 3, name: "Superadmin" },
	{ id: 4, name: "Developer" },
];

export function WhitelistModal({
	isOpen,
	onClose,
	onWhitelist,
	isProcessing,
	initialEmail,
	initialRoleIds,
}: WhitelistModalProps) {
	const [email, setEmail] = useState("");
	const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

	useEffect(() => {
		if (isOpen) {
			setEmail(initialEmail || "");
			setSelectedRoles(initialRoleIds || []);
		}
		// Only initialize when modal opens/closes to avoid reference-reset
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	const handleToggleRole = (roleId: number) => {
		setSelectedRoles((prev) =>
			prev.includes(roleId)
				? prev.filter((id) => id !== roleId)
				: [...prev, roleId],
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email || selectedRoles.length === 0) return;
		await onWhitelist(email, selectedRoles);
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => !open && onClose()}
		>
			<DialogContent className="dark:bg-neutral-900/92 border-white/20 bg-card backdrop-blur-2xl dark:border-white/10 sm:max-w-[425px]">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>
							{initialEmail ? "Edit Whitelisted Roles" : "Whitelist Account"}
						</DialogTitle>
						<DialogDescription>
							{initialEmail
								? "Update the allowed roles for this whitelisted email address."
								: "Pre-approve an email address and assign allowed roles for registration."}
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-6 py-6">
						<div className="space-y-2">
							<Label
								htmlFor="whitelist-email"
								className="text-sm font-semibold text-primary"
							>
								Email Address *
							</Label>
							<Input
								id="whitelist-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="user@example.com"
								className="rounded-xl border-white/20"
								disabled={!!initialEmail}
								required
							/>
						</div>

						<div className="space-y-3">
							<Label className="text-sm font-semibold text-foreground/80">
								Allowed Roles *
							</Label>
							<div className="grid grid-cols-2 gap-4">
								{AVAILABLE_ROLES.map((role) => (
									<div
										key={role.id}
										className="flex items-center space-x-2"
									>
										<Checkbox
											id={`whitelist-role-${role.id}`}
											name={`whitelist-role-${role.id}`}
											label={role.name}
											checked={selectedRoles.includes(role.id)}
											onChange={() => handleToggleRole(role.id)}
										/>
									</div>
								))}
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							className="rounded-xl"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={
								isProcessing || selectedRoles.length === 0 || !email
							}
							className="rounded-xl bg-primary text-primary-foreground hover:brightness-110"
						>
							{initialEmail
								? isProcessing
									? "Updating..."
									: "Update Roles"
								: isProcessing
									? "Whitelisting..."
									: "Whitelist Email"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
