import numpy as np
import matplotlib.pyplot as plt
from matplotlib import cm
from mpl_toolkits.mplot3d import Axes3D
import pandas as pd
from scipy.optimize import minimize_scalar

# Physical constants
q_e = 1.60217646e-19    # electron charge (C)
m_p = 1.67262192e-27    # proton mass (kg)
k_B = 1.38064852e-23    # Boltzmann constant (J/K)
J_eV = 6.241509e18      # joule to eV conversion

# Ion properties
N_ion = 171  # Yb-171
Z_ion = 1
m_ion = N_ion * m_p  # ion mass (kg)

# Units
MHz = 1e6
meV = 1e-3
um = 1e6

class EnhancedIonTrapOptimizer:
    def __init__(self, ion_mass_number=171, ion_charge=1):
        """
        Initialize the enhanced ion trap optimizer
        """
        self.N_ion = ion_mass_number
        self.Z_ion = ion_charge
        self.m_ion = self.N_ion * m_p
        
        # Target specifications
        self.target_specs = {
            'secular_freq': 2.5,      # MHz
            'q_max': 0.25,            # maximum q-parameter
            'V_rf_max': 250,          # V, maximum RF voltage
            'depth_min': 0.05,        # eV, minimum trap depth
            'depth_max': 0.1          # eV, maximum trap depth
        }
        
    def calculate_trap_height(self, a_prime, b_prime):
        """Calculate trap height"""
        return 0.95 * np.sqrt(a_prime * b_prime)
    
    def calculate_trap_depth(self, a_prime, b_prime, V_rf, F_rf):
        """Calculate trap depth in eV"""
        omega_rf = 2 * np.pi * F_rf * MHz
        
        # Convert from old notation: a = 2*a_prime, b = b_prime - a_prime
        a = 2 * a_prime
        b = b_prime - a_prime
        
        # From paste.txt formula
        e_factor = (self.Z_ion * q_e * V_rf)**2 / ((np.pi**2) * self.m_ion * (omega_rf**2))
        g_factor = (b / ((a + b)**2 + (a + b) * np.sqrt(2*a*b + a**2)))**2
        
        # Convert to eV and correct for um units
        depth = e_factor * g_factor * (um**2) * J_eV
        
        return depth
    
    def calculate_q_parameter(self, a_prime, b_prime, V_rf, F_rf):
        """Calculate Mathieu q parameter"""
        omega_rf = 2 * np.pi * F_rf * MHz
        
        # Using the formula from ab_calc.py (already in a', b' notation)
        q_val = (q_e * V_rf) / (self.m_ion * omega_rf**2) * \
                (8 * (b_prime - a_prime)) / (np.pi * np.sqrt(a_prime * b_prime) * (a_prime + b_prime)**2)
        
        # Apply um^2 correction
        q_val = abs(q_val * (um**2))
        
        return q_val
    
    def calculate_secular_frequency(self, a_prime, b_prime, V_rf, F_rf):
        """Calculate secular frequency in MHz"""
        q = self.calculate_q_parameter(a_prime, b_prime, V_rf, F_rf)
        omega_rf = 2 * np.pi * F_rf * MHz
        
        # Secular frequency formula
        omega_sec = q * omega_rf / (2 * np.sqrt(2))
        f_sec = omega_sec / (2 * np.pi * MHz)
        
        return f_sec
    
    def find_required_vrf_for_secular_freq(self, a_prime, b_prime, target_sec_freq, F_rf_range=(10, 50)):
        """
        Find the required V_rf to achieve target secular frequency
        Returns (F_rf, V_rf) pairs
        """
        F_rf_values = np.linspace(F_rf_range[0], F_rf_range[1], 100)
        solutions = []
        
        for F_rf in F_rf_values:
            # For target secular frequency, solve for required q
            omega_rf = 2 * np.pi * F_rf * MHz
            omega_sec_target = 2 * np.pi * target_sec_freq * MHz
            q_required = 2 * np.sqrt(2) * omega_sec_target / omega_rf
            
            # Solve for V_rf from q formula
            # q = (q_e * V_rf) / (m_ion * omega_rf^2) * geometric_factor
            geometric_factor = (8 * (b_prime - a_prime)) / (np.pi * np.sqrt(a_prime * b_prime) * (a_prime + b_prime)**2) * (um**2)
            
            V_rf_required = q_required * self.m_ion * omega_rf**2 / (q_e * geometric_factor)
            
            solutions.append({
                'F_rf': F_rf,
                'V_rf_required': V_rf_required,
                'q_required': q_required
            })
        
        return solutions
    
    def analyze_a70_limitations(self, b_prime_range=(80, 150), n_points=50):
        """
        Analyze limitations when a'=70
        """
        a_prime = 70
        b_prime_values = np.linspace(b_prime_range[0], b_prime_range[1], n_points)
        
        results = []
        
        for b_prime in b_prime_values:
            height = self.calculate_trap_height(a_prime, b_prime)
            
            # Find required V_rf for target secular frequency
            vrf_solutions = self.find_required_vrf_for_secular_freq(
                a_prime, b_prime, self.target_specs['secular_freq']
            )
            
            for sol in vrf_solutions:
                if sol['V_rf_required'] > 0:  # Only positive voltages
                    # Calculate other parameters
                    depth = self.calculate_trap_depth(a_prime, b_prime, sol['V_rf_required'], sol['F_rf'])
                    
                    # Check if meets all criteria
                    meets_criteria = (
                        sol['q_required'] <= self.target_specs['q_max'] and
                        sol['V_rf_required'] <= self.target_specs['V_rf_max'] and
                        self.target_specs['depth_min'] <= depth <= self.target_specs['depth_max']
                    )
                    
                    results.append({
                        'a_prime': a_prime,
                        'b_prime': b_prime,
                        'height': height,
                        'F_rf': sol['F_rf'],
                        'V_rf_required': sol['V_rf_required'],
                        'q': sol['q_required'],
                        'depth': depth,
                        'meets_criteria': meets_criteria,
                        'V_rf_feasible': sol['V_rf_required'] <= self.target_specs['V_rf_max'],
                        'q_feasible': sol['q_required'] <= self.target_specs['q_max'],
                        'depth_feasible': self.target_specs['depth_min'] <= depth <= self.target_specs['depth_max']
                    })
        
        return results
    
    def analyze_a_range(self, a_range=(50, 69), b_range=(70, 150), n_a=20, n_b=30):
        """
        Analyze parameter space for a' < 70
        Returns: (all_results, feasible_results)
        """
        a_prime_values = np.linspace(a_range[0], a_range[1], n_a)
        b_prime_values = np.linspace(b_range[0], b_range[1], n_b)
        
        results = []
        
        for a_prime in a_prime_values:
            for b_prime in b_prime_values:
                if b_prime <= a_prime:  # Skip unrealistic geometries
                    continue
                    
                height = self.calculate_trap_height(a_prime, b_prime)
                
                # Find required V_rf for target secular frequency
                vrf_solutions = self.find_required_vrf_for_secular_freq(
                    a_prime, b_prime, self.target_specs['secular_freq']
                )
                
                for sol in vrf_solutions:
                    if sol['V_rf_required'] > 0:  # Only positive voltages
                        # Calculate other parameters
                        depth = self.calculate_trap_depth(a_prime, b_prime, sol['V_rf_required'], sol['F_rf'])
                        
                        # Check if meets all criteria
                        meets_criteria = (
                            sol['q_required'] <= self.target_specs['q_max'] and
                            sol['V_rf_required'] <= self.target_specs['V_rf_max'] and
                            self.target_specs['depth_min'] <= depth <= self.target_specs['depth_max']
                        )
                        
                        results.append({
                            'a_prime': a_prime,
                            'b_prime': b_prime,
                            'height': height,
                            'F_rf': sol['F_rf'],
                            'V_rf_required': sol['V_rf_required'],
                            'q': sol['q_required'],
                            'depth': depth,
                            'meets_criteria': meets_criteria,
                            'V_rf_feasible': sol['V_rf_required'] <= self.target_specs['V_rf_max'],
                            'q_feasible': sol['q_required'] <= self.target_specs['q_max'],
                            'depth_feasible': self.target_specs['depth_min'] <= depth <= self.target_specs['depth_max']
                        })
        
        # Separate feasible solutions
        feasible_results = [r for r in results if r['meets_criteria']]
        
        return results, feasible_results
    
    def find_all_feasible_solutions(self, a_range=(50, 75), max_solutions=50):
        """
        Find all feasible solutions that meet the target specifications
        """
        print(f"Searching for solutions with target specifications:")
        print(f"  Secular frequency: {self.target_specs['secular_freq']} MHz")
        print(f"  q-parameter: ≤ {self.target_specs['q_max']}")
        print(f"  V_rf: ≤ {self.target_specs['V_rf_max']} V")
        print(f"  Trap depth: {self.target_specs['depth_min']}-{self.target_specs['depth_max']} eV")
        print()
        
        # Analyze the full range
        all_results, feasible_results = self.analyze_a_range(a_range=a_range, n_a=30, n_b=40)
        
        # Sort by how close to optimal (lower V_rf is better)
        feasible_results.sort(key=lambda x: x['V_rf_required'])
        
        # Limit number of solutions
        if len(feasible_results) > max_solutions:
            feasible_results = feasible_results[:max_solutions]
        
        return feasible_results, all_results
    
    def visualize_comprehensive_analysis(self, figsize=(20, 16)):
        """
        Create comprehensive visualization comparing a=70 vs a<70
        """
        # Analyze a=70 limitations
        print("Analyzing a'=70 limitations...")
        a70_results = self.analyze_a70_limitations()
        
        # Analyze a<70 possibilities
        print("Analyzing a'<70 possibilities...")
        all_small_a, feasible_solutions = self.analyze_a_range()
        
        # Convert to DataFrames for easier analysis
        df_a70 = pd.DataFrame(a70_results)
        df_small_a = pd.DataFrame(all_small_a)
        
        fig = plt.figure(figsize=figsize)
        
        # 1. V_rf requirements for a=70
        ax1 = plt.subplot(3, 4, 1)
        if len(df_a70) > 0:
            scatter1 = ax1.scatter(df_a70['b_prime'], df_a70['V_rf_required'], 
                                 c=df_a70['V_rf_feasible'], cmap='RdYlGn', s=30)
            ax1.axhline(y=self.target_specs['V_rf_max'], color='red', linestyle='--', 
                       label=f'V_rf limit ({self.target_specs["V_rf_max"]}V)')
            ax1.set_xlabel("b' (μm)")
            ax1.set_ylabel('Required V_rf (V)')
            ax1.set_title('a\'=70: V_rf Requirements')
            ax1.legend()
            ax1.grid(True, alpha=0.3)
            plt.colorbar(scatter1, ax=ax1, label='V_rf Feasible')
        
        # 2. q-parameter for a=70
        ax2 = plt.subplot(3, 4, 2)
        if len(df_a70) > 0:
            scatter2 = ax2.scatter(df_a70['b_prime'], df_a70['q'], 
                                 c=df_a70['q_feasible'], cmap='RdYlGn', s=30)
            ax2.axhline(y=self.target_specs['q_max'], color='red', linestyle='--', 
                       label=f'q limit ({self.target_specs["q_max"]})')
            ax2.set_xlabel("b' (μm)")
            ax2.set_ylabel('q-parameter')
            ax2.set_title('a\'=70: q-parameter')
            ax2.legend()
            ax2.grid(True, alpha=0.3)
            plt.colorbar(scatter2, ax=ax2, label='q Feasible')
        
        # 3. Trap depth for a=70
        ax3 = plt.subplot(3, 4, 3)
        if len(df_a70) > 0:
            scatter3 = ax3.scatter(df_a70['b_prime'], df_a70['depth'], 
                                 c=df_a70['depth_feasible'], cmap='RdYlGn', s=30)
            ax3.axhline(y=self.target_specs['depth_min'], color='red', linestyle='--', alpha=0.7)
            ax3.axhline(y=self.target_specs['depth_max'], color='red', linestyle='--', alpha=0.7,
                       label=f'Depth range ({self.target_specs["depth_min"]}-{self.target_specs["depth_max"]} eV)')
            ax3.set_xlabel("b' (μm)")
            ax3.set_ylabel('Trap Depth (eV)')
            ax3.set_title('a\'=70: Trap Depth')
            ax3.legend()
            ax3.grid(True, alpha=0.3)
            plt.colorbar(scatter3, ax=ax3, label='Depth Feasible')
        
        # 4. Overall feasibility for a=70
        ax4 = plt.subplot(3, 4, 4)
        if len(df_a70) > 0:
            scatter4 = ax4.scatter(df_a70['b_prime'], df_a70['height'], 
                                 c=df_a70['meets_criteria'], cmap='RdYlGn', s=50)
            ax4.set_xlabel("b' (μm)")
            ax4.set_ylabel('Height (μm)')
            ax4.set_title('a\'=70: Overall Feasibility')
            ax4.grid(True, alpha=0.3)
            plt.colorbar(scatter4, ax=ax4, label='Meets All Criteria')
        
        # 5-8. Similar plots for a<70
        # 5. V_rf requirements for a<70
        ax5 = plt.subplot(3, 4, 5)
        if len(df_small_a) > 0:
            scatter5 = ax5.scatter(df_small_a['a_prime'], df_small_a['V_rf_required'], 
                                 c=df_small_a['V_rf_feasible'], cmap='RdYlGn', s=20, alpha=0.6)
            ax5.axhline(y=self.target_specs['V_rf_max'], color='red', linestyle='--', 
                       label=f'V_rf limit ({self.target_specs["V_rf_max"]}V)')
            ax5.set_xlabel("a' (μm)")
            ax5.set_ylabel('Required V_rf (V)')
            ax5.set_title('a\'<70: V_rf Requirements')
            ax5.legend()
            ax5.grid(True, alpha=0.3)
            plt.colorbar(scatter5, ax=ax5, label='V_rf Feasible')
        
        # 6. q-parameter for a<70
        ax6 = plt.subplot(3, 4, 6)
        if len(df_small_a) > 0:
            scatter6 = ax6.scatter(df_small_a['a_prime'], df_small_a['q'], 
                                 c=df_small_a['q_feasible'], cmap='RdYlGn', s=20, alpha=0.6)
            ax6.axhline(y=self.target_specs['q_max'], color='red', linestyle='--', 
                       label=f'q limit ({self.target_specs["q_max"]})')
            ax6.set_xlabel("a' (μm)")
            ax6.set_ylabel('q-parameter')
            ax6.set_title('a\'<70: q-parameter')
            ax6.legend()
            ax6.grid(True, alpha=0.3)
            plt.colorbar(scatter6, ax=ax6, label='q Feasible')
        
        # 7. Trap depth for a<70
        ax7 = plt.subplot(3, 4, 7)
        if len(df_small_a) > 0:
            scatter7 = ax7.scatter(df_small_a['a_prime'], df_small_a['depth'], 
                                 c=df_small_a['depth_feasible'], cmap='RdYlGn', s=20, alpha=0.6)
            ax7.axhline(y=self.target_specs['depth_min'], color='red', linestyle='--', alpha=0.7)
            ax7.axhline(y=self.target_specs['depth_max'], color='red', linestyle='--', alpha=0.7,
                       label=f'Depth range ({self.target_specs["depth_min"]}-{self.target_specs["depth_max"]} eV)')
            ax7.set_xlabel("a' (μm)")
            ax7.set_ylabel('Trap Depth (eV)')
            ax7.set_title('a\'<70: Trap Depth')
            ax7.legend()
            ax7.grid(True, alpha=0.3)
            plt.colorbar(scatter7, ax=ax7, label='Depth Feasible')
        
        # 8. Overall feasibility for a<70
        ax8 = plt.subplot(3, 4, 8)
        if len(df_small_a) > 0:
            # Color by a' value for feasible solutions
            feasible_mask = df_small_a['meets_criteria']
            if feasible_mask.sum() > 0:
                scatter8a = ax8.scatter(df_small_a[feasible_mask]['a_prime'], 
                                      df_small_a[feasible_mask]['b_prime'], 
                                      c=df_small_a[feasible_mask]['a_prime'], 
                                      cmap='viridis', s=50, label='Feasible')
            
            # Plot infeasible solutions in gray
            infeasible_mask = ~df_small_a['meets_criteria']
            if infeasible_mask.sum() > 0:
                ax8.scatter(df_small_a[infeasible_mask]['a_prime'], 
                           df_small_a[infeasible_mask]['b_prime'], 
                           c='lightgray', s=20, alpha=0.3, label='Infeasible')
            
            ax8.set_xlabel("a' (μm)")
            ax8.set_ylabel("b' (μm)")
            ax8.set_title('a\'<70: Feasible Solutions')
            ax8.legend()
            ax8.grid(True, alpha=0.3)
            if feasible_mask.sum() > 0:
                plt.colorbar(scatter8a, ax=ax8, label="a' (μm)")
        
        # 9-12. Summary statistics and best solutions
        # 9. Comparison statistics
        ax9 = plt.subplot(3, 4, 9)
        ax9.axis('off')
        
        # Calculate statistics
        a70_feasible = df_a70['meets_criteria'].sum() if len(df_a70) > 0 else 0
        a70_total = len(df_a70)
        small_a_feasible = df_small_a['meets_criteria'].sum() if len(df_small_a) > 0 else 0
        small_a_total = len(df_small_a)
        
        stats_text = "COMPARISON STATISTICS\n\n"
        stats_text += f"a' = 70 μm:\n"
        stats_text += f"  Feasible: {a70_feasible}/{a70_total}\n"
        stats_text += f"  Success rate: {100*a70_feasible/max(a70_total,1):.1f}%\n\n"
        stats_text += f"a' < 70 μm:\n"
        stats_text += f"  Feasible: {small_a_feasible}/{small_a_total}\n"
        stats_text += f"  Success rate: {100*small_a_feasible/max(small_a_total,1):.1f}%\n\n"
        
        if a70_total > 0:
            min_vrf_a70 = df_a70['V_rf_required'].min()
            stats_text += f"a'=70 min V_rf: {min_vrf_a70:.0f}V\n"
        if small_a_total > 0:
            min_vrf_small = df_small_a['V_rf_required'].min()
            stats_text += f"a'<70 min V_rf: {min_vrf_small:.0f}V\n"
        
        ax9.text(0.05, 0.95, stats_text, transform=ax9.transAxes, fontsize=10,
                verticalalignment='top', fontfamily='monospace',
                bbox=dict(boxstyle='round,pad=0.5', facecolor='lightblue', alpha=0.7))
        
        # 10. Best solutions for a<70
        ax10 = plt.subplot(3, 4, 10)
        ax10.axis('off')
        
        # Find best solutions
        feasible_small_a = df_small_a[df_small_a['meets_criteria']]
        if len(feasible_small_a) > 0:
            # Sort by V_rf (lower is better)
            best_solutions = feasible_small_a.nsmallest(10, 'V_rf_required')
            
            solution_text = "BEST SOLUTIONS (a'<70)\n"
            solution_text += "Sorted by V_rf requirement\n\n"
            
            for i, (_, sol) in enumerate(best_solutions.iterrows()):
                if i < 8:  # Limit display
                    solution_text += f"{i+1}. a'={sol['a_prime']:.1f}, b'={sol['b_prime']:.1f}\n"
                    solution_text += f"   V_rf={sol['V_rf_required']:.0f}V, F_rf={sol['F_rf']:.1f}MHz\n"
                    solution_text += f"   q={sol['q']:.3f}, depth={sol['depth']:.3f}eV\n\n"
        else:
            solution_text = "NO FEASIBLE SOLUTIONS\nFOUND FOR a'<70"
        
        ax10.text(0.05, 0.95, solution_text, transform=ax10.transAxes, fontsize=9,
                 verticalalignment='top', fontfamily='monospace',
                 bbox=dict(boxstyle='round,pad=0.5', facecolor='lightgreen', alpha=0.7))
        
        # 11. V_rf distribution comparison
        ax11 = plt.subplot(3, 4, 11)
        if len(df_a70) > 0 and len(df_small_a) > 0:
            ax11.hist(df_a70['V_rf_required'], bins=30, alpha=0.7, label='a\'=70', color='red')
            ax11.hist(df_small_a['V_rf_required'], bins=30, alpha=0.7, label='a\'<70', color='blue')
            ax11.axvline(x=self.target_specs['V_rf_max'], color='black', linestyle='--', 
                        label=f'V_rf limit ({self.target_specs["V_rf_max"]}V)')
            ax11.set_xlabel('Required V_rf (V)')
            ax11.set_ylabel('Frequency')
            ax11.set_title('V_rf Distribution Comparison')
            ax11.legend()
            ax11.grid(True, alpha=0.3)
        
        # 12. 3D plot of feasible solutions
        ax12 = fig.add_subplot(3, 4, 12, projection='3d')
        if len(df_small_a) > 0:
            feasible = df_small_a[df_small_a['meets_criteria']]
            infeasible = df_small_a[~df_small_a['meets_criteria']]
            
            if len(feasible) > 0:
                ax12.scatter(feasible['a_prime'], feasible['b_prime'], feasible['V_rf_required'],
                           c='green', s=50, alpha=0.8, label='Feasible')
            if len(infeasible) > 0:
                ax12.scatter(infeasible['a_prime'], infeasible['b_prime'], infeasible['V_rf_required'],
                           c='red', s=20, alpha=0.3, label='Infeasible')
            
            ax12.set_xlabel("a' (μm)")
            ax12.set_ylabel("b' (μm)")
            ax12.set_zlabel('V_rf (V)')
            ax12.set_title('3D: Feasible Solutions')
            ax12.legend()
        
        plt.suptitle('Ion Trap Analysis: a\'=70 Limitations vs a\'<70 Possibilities', 
                     fontsize=16, y=0.98)
        plt.tight_layout(rect=[0, 0.02, 1, 0.96])
        plt.show()
        
        return df_a70, df_small_a, feasible_solutions

# Example usage
if __name__ == "__main__":
    # Create enhanced optimizer
    optimizer = EnhancedIonTrapOptimizer()
    
    print("Enhanced Ion Trap Analysis")
    print("=" * 50)
    
    # Run comprehensive analysis
    df_a70, df_small_a, feasible_solutions = optimizer.visualize_comprehensive_analysis()
    
    # Print summary
    print(f"\nSUMMARY:")
    print(f"Target: secular_freq={optimizer.target_specs['secular_freq']}MHz, "
          f"q≤{optimizer.target_specs['q_max']}, V_rf≤{optimizer.target_specs['V_rf_max']}V, "
          f"depth={optimizer.target_specs['depth_min']}-{optimizer.target_specs['depth_max']}eV")
    
    a70_feasible = df_a70['meets_criteria'].sum() if len(df_a70) > 0 else 0
    small_a_feasible = len(feasible_solutions)
    
    print(f"\nResults:")
    print(f"  a'=70: {a70_feasible} feasible solutions")
    print(f"  a'<70: {small_a_feasible} feasible solutions")
    
    if small_a_feasible > 0:
        best_sol = feasible_solutions[0]  # Already sorted by V_rf
        print(f"\nBest solution (lowest V_rf):")
        print(f"  a'={best_sol['a_prime']:.1f}μm, b'={best_sol['b_prime']:.1f}μm")
        print(f"  V_rf={best_sol['V_rf_required']:.0f}V, F_rf={best_sol['F_rf']:.1f}MHz")
        print(f"  q={best_sol['q']:.3f}, depth={best_sol['depth']:.3f}eV")
        print(f"  height={best_sol['height']:.1f}μm")