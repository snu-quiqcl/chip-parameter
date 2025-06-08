import { q_e, m_p, MHz, J_eV, um } from './constants';

export interface TargetSpecs {
  secular_freq: number;      // MHz
  q_max: number;            // maximum q-parameter
  V_rf_max: number;         // V, maximum RF voltage
  depth_min: number;        // eV, minimum trap depth
  depth_max: number;        // eV, maximum trap depth
}

export interface Solution {
  a: number;
  b: number;
  height: number;
  F_rf: number;
  V_rf_required: number;
  q: number;
  depth: number;
  meets_criteria: boolean;
  V_rf_feasible: boolean;
  q_feasible: boolean;
  depth_feasible: boolean;
}

export class IonTrapOptimizer {
  private N_ion: number;
  private Z_ion: number;
  private m_ion: number;
  public target_specs: TargetSpecs;
  public slot_correction_factor: number;

  constructor(ion_mass_number: number = 171, ion_charge: number = 1) {
    this.N_ion = ion_mass_number;
    this.Z_ion = ion_charge;
    this.m_ion = this.N_ion * m_p;
    this.slot_correction_factor = 0.95;
    
    this.target_specs = {
      secular_freq: 2.5,
      q_max: 0.25,
      V_rf_max: 250,
      depth_min: 0.05,
      depth_max: 0.1
    };
  }

  calculateTrapHeight(a: number, b: number): number {
    return this.slot_correction_factor * Math.sqrt(a * b);
  }

  calculateTrapDepth(a: number, b: number, V_rf: number, F_rf: number): number {
    const omega_rf = 2 * Math.PI * F_rf * MHz;
    
    // Convert from old notation
    const a_converted = 2 * a;
    const b_converted = b - a;
    
    const e_factor = Math.pow(this.Z_ion * q_e * V_rf, 2) / (Math.pow(Math.PI, 2) * this.m_ion * Math.pow(omega_rf, 2));
    const g_factor = Math.pow(b_converted / (Math.pow(a_converted + b_converted, 2) + (a_converted + b_converted) * Math.sqrt(2 * a_converted * b_converted + Math.pow(a_converted, 2))), 2);
    
    const depth = e_factor * g_factor * Math.pow(um, 2) * J_eV;
    
    return depth;
  }

  calculateQParameter(a: number, b: number, V_rf: number, F_rf: number): number {
    const omega_rf = 2 * Math.PI * F_rf * MHz;
    
    // Convert from new notation to House paper notation
    const a_converted = 2 * a;
    const b_converted = b - a;
    
    const q_val = (q_e * V_rf) / (this.m_ion * Math.pow(omega_rf, 2)) * 
                  (8 * b_converted) / (Math.PI * Math.sqrt(a * b) * Math.pow(a_converted + b_converted, 2));
    
    return Math.abs(q_val * Math.pow(um, 2));
  }

  calculateSecularFrequency(a: number, b: number, V_rf: number, F_rf: number): number {
    const q = this.calculateQParameter(a, b, V_rf, F_rf);
    const omega_rf = 2 * Math.PI * F_rf * MHz;
    
    const omega_sec = q * omega_rf / (2 * Math.sqrt(2));
    const f_sec = omega_sec / (2 * Math.PI * MHz);
    
    return f_sec;
  }

  findRequiredVrfForSecularFreq(
    a: number, 
    b: number, 
    target_sec_freq: number, 
    F_rf_range: [number, number] = [10, 50]
  ): Array<{F_rf: number; V_rf_required: number; q_required: number}> {
    const F_rf_values = Array.from({length: 100}, (_, i) => 
      F_rf_range[0] + (F_rf_range[1] - F_rf_range[0]) * i / 99
    );
    
    const solutions: Array<{F_rf: number; V_rf_required: number; q_required: number}> = [];
    
    for (const F_rf of F_rf_values) {
      const omega_rf = 2 * Math.PI * F_rf * MHz;
      const omega_sec_target = 2 * Math.PI * target_sec_freq * MHz;
      const q_required = 2 * Math.sqrt(2) * omega_sec_target / omega_rf;
      
      const geometric_factor = (8 * (b - a)) / 
        (Math.PI * Math.sqrt(a * b) * Math.pow(a + b, 2)) * Math.pow(um, 2);
      
      const V_rf_required = q_required * this.m_ion * Math.pow(omega_rf, 2) / (q_e * geometric_factor);
      
      solutions.push({
        F_rf,
        V_rf_required,
        q_required
      });
    }
    
    return solutions;
  }

  analyzeParameterSpace(
    a_range: [number, number] = [50, 69],
    b_range: [number, number] = [70, 150],
    n_a: number = 20,
    n_b: number = 30
  ): { all_results: Solution[], feasible_results: Solution[] } {
    const a_values = Array.from({length: n_a}, (_, i) => 
      a_range[0] + (a_range[1] - a_range[0]) * i / (n_a - 1)
    );
    const b_values = Array.from({length: n_b}, (_, i) => 
      b_range[0] + (b_range[1] - b_range[0]) * i / (n_b - 1)
    );
    
    const results: Solution[] = [];
    
    for (const a of a_values) {
      for (const b of b_values) {
        if (b <= a) continue;
        
        const height = this.calculateTrapHeight(a, b);
        const vrf_solutions = this.findRequiredVrfForSecularFreq(
          a, b, this.target_specs.secular_freq
        );
        
        for (const sol of vrf_solutions) {
          if (sol.V_rf_required > 0) {
            const depth = this.calculateTrapDepth(a, b, sol.V_rf_required, sol.F_rf);
            
            const meets_criteria = 
              sol.q_required <= this.target_specs.q_max &&
              sol.V_rf_required <= this.target_specs.V_rf_max &&
              depth >= this.target_specs.depth_min &&
              depth <= this.target_specs.depth_max;
            
            results.push({
              a,
              b,
              height,
              F_rf: sol.F_rf,
              V_rf_required: sol.V_rf_required,
              q: sol.q_required,
              depth,
              meets_criteria,
              V_rf_feasible: sol.V_rf_required <= this.target_specs.V_rf_max,
              q_feasible: sol.q_required <= this.target_specs.q_max,
              depth_feasible: depth >= this.target_specs.depth_min && depth <= this.target_specs.depth_max
            });
          }
        }
      }
    }
    
    const feasible_results = results.filter(r => r.meets_criteria);
    feasible_results.sort((a, b) => a.V_rf_required - b.V_rf_required);
    
    return { all_results: results, feasible_results };
  }

  analyzeA70Limitations(
    b_range: [number, number] = [80, 150],
    n_points: number = 50
  ): Solution[] {
    const a = 70;
    const b_values = Array.from({length: n_points}, (_, i) => 
      b_range[0] + (b_range[1] - b_range[0]) * i / (n_points - 1)
    );
    
    const results: Solution[] = [];
    
    for (const b of b_values) {
      const height = this.calculateTrapHeight(a, b);
      const vrf_solutions = this.findRequiredVrfForSecularFreq(
        a, b, this.target_specs.secular_freq
      );
      
      for (const sol of vrf_solutions) {
        if (sol.V_rf_required > 0) {
          const depth = this.calculateTrapDepth(a, b, sol.V_rf_required, sol.F_rf);
          
          const meets_criteria = 
            sol.q_required <= this.target_specs.q_max &&
            sol.V_rf_required <= this.target_specs.V_rf_max &&
            depth >= this.target_specs.depth_min &&
            depth <= this.target_specs.depth_max;
          
          results.push({
            a,
            b,
            height,
            F_rf: sol.F_rf,
            V_rf_required: sol.V_rf_required,
            q: sol.q_required,
            depth,
            meets_criteria,
            V_rf_feasible: sol.V_rf_required <= this.target_specs.V_rf_max,
            q_feasible: sol.q_required <= this.target_specs.q_max,
            depth_feasible: depth >= this.target_specs.depth_min && depth <= this.target_specs.depth_max
          });
        }
      }
    }
    
    return results;
  }
}