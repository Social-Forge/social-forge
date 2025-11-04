export function isAgentAssignmentArray(data: any): data is AgentAssignment[] {
	return (
		Array.isArray(data) &&
		data.every((item) => typeof item === 'object' && item !== null && 'agent_id' in item)
	);
}
export function getAssignedAgentIds(agents: any[]): string[] {
	return agents.map((a) => a?.id).filter((id): id is string => !!id);
}
