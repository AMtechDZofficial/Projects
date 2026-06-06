interface OperationInput {
  id: string;
  name: string;
  standardMinutes: number | string;
  sequence: number;
  machineType?: string | null;
}

export interface Station {
  operationId: string;
  operationName: string;
  tmo: number;
  requiredOperators: number;
  machineType?: string;
  utilization: number;
  bottleneck: boolean;
}

export interface LineBalancingResult {
  cycleTime: number;
  targetOutput: number;
  availableMinutes: number;
  totalTMO: number;
  totalOperators: number;
  lineEfficiency: number;
  bottleneckOperation: string;
  stations: Station[];
}

export function calculateLineBalance(
  operations: OperationInput[],
  targetOutput: number,
  availableMinutes: number,
  efficiency = 0.8
): LineBalancingResult {
  if (!operations.length || targetOutput <= 0 || availableMinutes <= 0) {
    return {
      cycleTime: 0, targetOutput, availableMinutes,
      totalTMO: 0, totalOperators: 0, lineEfficiency: 0,
      bottleneckOperation: '', stations: []
    };
  }

  const effectiveMinutes = availableMinutes * efficiency;
  const cycleTime = effectiveMinutes / targetOutput;

  const sorted = [...operations].sort((a, b) => a.sequence - b.sequence);

  const stations: Station[] = sorted.map(op => {
    const tmo = Number(op.standardMinutes);
    const requiredOperators = Math.max(1, Math.ceil(tmo / cycleTime));
    const utilization = (tmo / (requiredOperators * cycleTime)) * 100;
    return {
      operationId: op.id,
      operationName: op.name,
      tmo,
      requiredOperators,
      machineType: op.machineType || undefined,
      utilization,
      bottleneck: false
    };
  });

  const maxTMO = Math.max(...stations.map(s => s.tmo));
  const bottleneckStation = stations.find(s => s.tmo === maxTMO);
  if (bottleneckStation) bottleneckStation.bottleneck = true;

  const totalTMO = stations.reduce((sum, s) => sum + s.tmo, 0);
  const totalOperators = stations.reduce((sum, s) => sum + s.requiredOperators, 0);
  const lineEfficiency = totalOperators > 0 ? (totalTMO / (totalOperators * cycleTime)) * 100 : 0;

  return {
    cycleTime,
    targetOutput,
    availableMinutes,
    totalTMO,
    totalOperators,
    lineEfficiency,
    bottleneckOperation: bottleneckStation?.operationName || '',
    stations
  };
}
