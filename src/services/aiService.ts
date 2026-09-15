import { MOCK_MODEL_VERSIONS } from '../data/mockData';
import { ModelVersion } from '../types';
import { IAiService } from './types';

class AiService implements IAiService {
  private models: ModelVersion[] = [...MOCK_MODEL_VERSIONS];

  async getModelVersions(): Promise<ModelVersion[]> {
    return [...this.models];
  }

  async deployModelToFleet(versionId: string, busIds: string[]): Promise<boolean> {
    const model = this.models.find((m) => m.version_id === versionId);
    if (!model) return false;
    model.deployed_fleet_count += busIds.length;
    return true;
  }

  async getInferenceMetrics(): Promise<{
    averageLatencyMs: number;
    detectionsLastHour: number;
    falsePositiveRatePercent: number;
    activeModels: number;
  }> {
    return {
      averageLatencyMs: 19.8,
      detectionsLastHour: 184,
      falsePositiveRatePercent: 2.1,
      activeModels: this.models.filter((m) => m.status === 'ACTIVE' || m.status === 'CANARY').length,
    };
  }
}

export const aiService = new AiService();
