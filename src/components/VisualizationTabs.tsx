import * as Tabs from '@radix-ui/react-tabs';
import { Solution, TargetSpecs } from '../utils/ionTrapOptimizer';
import { VrfRequirementsChart } from './charts/VrfRequirementsChart';
import { QParameterChart } from './charts/QParameterChart';
import { TrapDepthChart } from './charts/TrapDepthChart';
import { FeasibilityChart } from './charts/FeasibilityChart';
import './VisualizationTabs.css';

interface VisualizationTabsProps {
  a70Results: Solution[];
  smallAResults: { all_results: Solution[]; feasible_results: Solution[] };
  targetSpecs: TargetSpecs;
}

export function VisualizationTabs({ a70Results, smallAResults, targetSpecs }: VisualizationTabsProps) {
  return (
    <Tabs.Root className="tabs-root" defaultValue="vrf">
      <Tabs.List className="tabs-list">
        <Tabs.Trigger className="tabs-trigger" value="vrf">
          V_rf Requirements
        </Tabs.Trigger>
        <Tabs.Trigger className="tabs-trigger" value="q">
          q-Parameter
        </Tabs.Trigger>
        <Tabs.Trigger className="tabs-trigger" value="depth">
          Trap Depth
        </Tabs.Trigger>
        <Tabs.Trigger className="tabs-trigger" value="feasibility">
          Feasibility Map
        </Tabs.Trigger>
      </Tabs.List>
      
      <Tabs.Content className="tabs-content" value="vrf">
        <VrfRequirementsChart
          a70Results={a70Results}
          smallAResults={smallAResults.all_results}
          targetSpecs={targetSpecs}
        />
      </Tabs.Content>
      
      <Tabs.Content className="tabs-content" value="q">
        <QParameterChart
          a70Results={a70Results}
          smallAResults={smallAResults.all_results}
          targetSpecs={targetSpecs}
        />
      </Tabs.Content>
      
      <Tabs.Content className="tabs-content" value="depth">
        <TrapDepthChart
          a70Results={a70Results}
          smallAResults={smallAResults.all_results}
          targetSpecs={targetSpecs}
        />
      </Tabs.Content>
      
      <Tabs.Content className="tabs-content" value="feasibility">
        <FeasibilityChart
          smallAResults={smallAResults.all_results}
          feasibleResults={smallAResults.feasible_results}
        />
      </Tabs.Content>
    </Tabs.Root>
  );
}