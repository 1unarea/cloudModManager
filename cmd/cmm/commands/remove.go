package commands

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"cmm/internal/mod"
	"cmm/internal/modrinth"
	"github.com/spf13/cobra"
)

var (
	removeDryRun bool
)

var removeCmd = &cobra.Command{
	Use:   "remove <slug>",
	Short: "Remove an installed mod",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		slug := args[0]

		userAgent := "CloudModManager/1.0 (contact: user@domain.local)"
		client, err := modrinth.NewClient(userAgent)
		if err != nil {
			fmt.Fprintf(os.Stderr, "[ERROR] Failed to create Modrinth client: %v\n", err)
			os.Exit(1)
		}

		mgr := mod.NewManager(client, "cmm.toml", "cmm.lock")

		res, err := mgr.Remove(slug, removeDryRun)
		if err != nil {
			fmt.Fprintf(os.Stderr, "[ERROR] Failed to remove mod '%s': %v\n", slug, err)
			os.Exit(1)
		}

		if res.DryRun {
			fmt.Printf("[INFO] [Dry Run] Would remove mod '%s'\n", slug)
			for _, file := range res.RemovedFiles {
				fmt.Printf("[INFO] [Dry Run] Would delete file: %s\n", file)
			}
			if len(res.OrphanedDeps) > 0 {
				fmt.Printf("[INFO] [Dry Run] Would prompt to remove orphaned dependencies: %s\n", strings.Join(res.OrphanedDeps, ", "))
			}
			return
		}

		fmt.Printf("[OK] Successfully removed mod '%s'.\n", slug)

		if len(res.OrphanedDeps) > 0 {
			reader := bufio.NewReader(os.Stdin)
			fmt.Printf("[INFO] The following orphaned dependencies are no longer required: %s\n", strings.Join(res.OrphanedDeps, ", "))
			fmt.Print("Remove orphaned dependencies? [y/N]: ")
			input, err := reader.ReadString('\n')
			if err == nil {
				input = strings.TrimSpace(strings.ToLower(input))
				if input == "y" || input == "yes" {
					for _, orphan := range res.OrphanedDeps {
						if err := mgr.RemoveOrphan(orphan); err != nil {
							fmt.Fprintf(os.Stderr, "[ERROR] Failed to remove orphan %s: %v\n", orphan, err)
						} else {
							fmt.Printf("[OK] Removed orphaned dependency: %s\n", orphan)
						}
					}
				}
			}
		}
	},
}

func init() {
	rootCmd.AddCommand(removeCmd)
	removeCmd.Flags().BoolVar(&removeDryRun, "dry-run", false, "Preview mod removal without making changes")
}
