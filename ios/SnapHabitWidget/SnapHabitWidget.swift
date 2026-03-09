import WidgetKit
import SwiftUI

// MARK: - Shared Data Models

struct WidgetHabit: Codable, Identifiable {
  let habitId: String
  let name: String
  let icon: String
  let color: String
  let isCompleted: Bool
  let isSkipped: Bool
  let streak: Int
  let status: String

  var id: String { habitId }
}

struct WidgetSnapshot: Codable {
  let date: String
  let habits: [WidgetHabit]
  let updatedAt: String
}

// MARK: - Timeline Entry

struct HabitEntry: TimelineEntry {
  let date: Date
  let snapshot: WidgetSnapshot?
}

// MARK: - Timeline Provider

struct HabitTimelineProvider: TimelineProvider {
  private let appGroupID = "group.com.snaphabit.app"
  private let snapshotKey = "today_snapshot"

  func placeholder(in context: Context) -> HabitEntry {
    HabitEntry(date: Date(), snapshot: placeholderSnapshot())
  }

  func getSnapshot(in context: Context, completion: @escaping (HabitEntry) -> Void) {
    let entry = HabitEntry(date: Date(), snapshot: loadSnapshot())
    completion(entry)
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<HabitEntry>) -> Void) {
    let entry = HabitEntry(date: Date(), snapshot: loadSnapshot())
    let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
    let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
    completion(timeline)
  }

  private func loadSnapshot() -> WidgetSnapshot? {
    guard let defaults = UserDefaults(suiteName: appGroupID),
          let jsonString = defaults.string(forKey: snapshotKey),
          let data = jsonString.data(using: .utf8) else {
      return nil
    }
    return try? JSONDecoder().decode(WidgetSnapshot.self, from: data)
  }

  private func placeholderSnapshot() -> WidgetSnapshot {
    WidgetSnapshot(
      date: "2026-03-08",
      habits: [
        WidgetHabit(habitId: "1", name: "Hydration", icon: "water", color: "#3B82F6",
                    isCompleted: true, isSkipped: false, streak: 5, status: "completed"),
        WidgetHabit(habitId: "2", name: "Exercise", icon: "fitness", color: "#EF4444",
                    isCompleted: false, isSkipped: false, streak: 3, status: "active"),
        WidgetHabit(habitId: "3", name: "Reading", icon: "book", color: "#8B5CF6",
                    isCompleted: true, isSkipped: false, streak: 12, status: "completed"),
        WidgetHabit(habitId: "4", name: "Meditation", icon: "leaf", color: "#22C55E",
                    isCompleted: false, isSkipped: false, streak: 1, status: "active"),
      ],
      updatedAt: "2026-03-08T10:00:00.000Z"
    )
  }
}

// MARK: - Color Helpers

extension Color {
  init(hex: String) {
    let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
    var int: UInt64 = 0
    Scanner(string: hex).scanHexInt64(&int)
    let r = Double((int >> 16) & 0xFF) / 255.0
    let g = Double((int >> 8) & 0xFF) / 255.0
    let b = Double(int & 0xFF) / 255.0
    self.init(red: r, green: g, blue: b)
  }

  /// Return a lighter variant (for backgrounds / gradients)
  func lightened(by amount: Double = 0.35) -> Color {
    // Mix with white
    let uiColor = UIColor(self)
    var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
    uiColor.getRed(&r, green: &g, blue: &b, alpha: &a)
    return Color(
      red: min(Double(r) + amount, 1.0),
      green: min(Double(g) + amount, 1.0),
      blue: min(Double(b) + amount, 1.0)
    )
  }
}

// MARK: - Ionicons Name → SF Symbol Mapping

func sfSymbol(for ionicon: String) -> String {
  switch ionicon {
  case "water":           return "drop.fill"
  case "fitness":         return "figure.run"
  case "book":            return "book.fill"
  case "leaf":            return "leaf.fill"
  case "moon":            return "moon.fill"
  case "pencil":          return "pencil"
  case "flash":           return "bolt.fill"
  case "nutrition":       return "fork.knife"
  case "walk":            return "figure.walk"
  case "medkit":          return "cross.case.fill"
  case "musical-notes":   return "music.note"
  case "flower":          return "camera.macro"
  case "flag":            return "flag.fill"
  case "bed":             return "bed.double.fill"
  case "heart":           return "heart.fill"
  case "happy":           return "face.smiling.fill"
  case "brush":           return "paintbrush.fill"
  case "camera":          return "camera.fill"
  case "barbell":         return "dumbbell.fill"
  case "bicycle":         return "bicycle"
  case "cafe":            return "cup.and.saucer.fill"
  case "code-slash":      return "chevron.left.forwardslash.chevron.right"
  case "globe":           return "globe"
  case "language":        return "globe"
  case "game-controller": return "gamecontroller.fill"
  case "briefcase":       return "briefcase.fill"
  case "cart":            return "cart.fill"
  case "home":            return "house.fill"
  case "paw":             return "pawprint.fill"
  case "desktop":         return "desktopcomputer"
  case "rocket":          return "paperplane.fill"
  default:                return "circle.fill"
  }
}

// MARK: - Greeting Helper

func greeting() -> String {
  let hour = Calendar.current.component(.hour, from: Date())
  if hour < 12 { return "Good Morning ☀️" }
  if hour < 18 { return "Good Afternoon 🌤" }
  return "Good Evening 🌙"
}

// MARK: - Animated Progress Ring

struct ProgressRing: View {
  let progress: Double
  let lineWidth: CGFloat
  let gradientColors: [Color]
  let size: CGFloat

  var body: some View {
    ZStack {
      // Background track
      Circle()
        .stroke(
          Color.gray.opacity(0.12),
          style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
        )
      // Gradient progress arc
      Circle()
        .trim(from: 0, to: min(progress, 1.0))
        .stroke(
          AngularGradient(
            gradient: Gradient(colors: gradientColors),
            center: .center,
            startAngle: .degrees(-90),
            endAngle: .degrees(270)
          ),
          style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
        )
        .rotationEffect(.degrees(-90))
      // Glow dot at tip
      if progress > 0.03 {
        Circle()
          .fill(gradientColors.last ?? .green)
          .frame(width: lineWidth + 2, height: lineWidth + 2)
          .shadow(color: (gradientColors.last ?? .green).opacity(0.6), radius: 4)
          .offset(y: -(size / 2))
          .rotationEffect(.degrees(360 * progress - 90))
      }
    }
    .frame(width: size, height: size)
  }
}

// MARK: - Habit Row (for Medium / Large)

struct HabitRow: View {
  let habit: WidgetHabit
  let compact: Bool

  var body: some View {
    let habitColor = Color(hex: habit.color)

    HStack(spacing: compact ? 8 : 10) {
      // Icon pill
      ZStack {
        RoundedRectangle(cornerRadius: 8)
          .fill(
            habit.isCompleted
              ? habitColor.opacity(0.15)
              : Color.gray.opacity(0.08)
          )
        Image(systemName: sfSymbol(for: habit.icon))
          .font(.system(size: compact ? 11 : 13, weight: .semibold))
          .foregroundColor(habit.isCompleted ? habitColor : .gray.opacity(0.5))
      }
      .frame(width: compact ? 26 : 30, height: compact ? 26 : 30)

      // Name
      Text(habit.name)
        .font(.system(size: compact ? 12 : 13, weight: .medium))
        .foregroundColor(habit.isCompleted ? .secondary : .primary)
        .lineLimit(1)

      Spacer()

      // Status badge
      if habit.isCompleted {
        Image(systemName: "checkmark.circle.fill")
          .font(.system(size: compact ? 15 : 17))
          .foregroundColor(habitColor)
      } else if habit.isSkipped {
        Text("Skip")
          .font(.system(size: 10, weight: .medium))
          .foregroundColor(.orange)
          .padding(.horizontal, 6)
          .padding(.vertical, 2)
          .background(Color.orange.opacity(0.12))
          .clipShape(Capsule())
      } else {
        // Streak flame
        if habit.streak > 0 {
          HStack(spacing: 2) {
            Text("🔥")
              .font(.system(size: compact ? 9 : 10))
            Text("\(habit.streak)")
              .font(.system(size: compact ? 10 : 11, weight: .bold, design: .rounded))
              .foregroundColor(.orange)
          }
        } else {
          Circle()
            .strokeBorder(Color.gray.opacity(0.3), lineWidth: 1.5)
            .frame(width: compact ? 15 : 17, height: compact ? 15 : 17)
        }
      }
    }
  }
}

// MARK: - Small Widget View

struct SmallWidgetView: View {
  let snapshot: WidgetSnapshot?

  var body: some View {
    if let snap = snapshot {
      let active = snap.habits.filter { $0.status != "rest" && $0.status != "skipped" }
      let completed = active.filter { $0.isCompleted }.count
      let total = max(active.count, 1)
      let progress = Double(completed) / Double(total)
      let allDone = completed == total && total > 0

      VStack(spacing: 6) {
        // Progress ring with count
        ZStack {
          ProgressRing(
            progress: progress,
            lineWidth: 7,
            gradientColors: allDone
              ? [Color(hex: "#22C55E"), Color(hex: "#10B981")]
              : [Color(hex: "#3B82F6"), Color(hex: "#8B5CF6")],
            size: 72
          )
          VStack(spacing: -2) {
            if allDone {
              Image(systemName: "checkmark")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(Color(hex: "#22C55E"))
            } else {
              Text("\(completed)")
                .font(.system(size: 26, weight: .bold, design: .rounded))
                .foregroundColor(.primary)
              Text("/\(total)")
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundColor(.secondary)
            }
          }
        }

        // Mini habit dots
        HStack(spacing: 4) {
          ForEach(Array(snap.habits.filter { $0.status != "rest" }.prefix(6)), id: \.habitId) { h in
            Circle()
              .fill(h.isCompleted ? Color(hex: h.color) : Color.gray.opacity(0.2))
              .frame(width: 8, height: 8)
          }
        }

        Text(allDone ? "All Done! 🎉" : "Today")
          .font(.system(size: 11, weight: .semibold, design: .rounded))
          .foregroundColor(allDone ? Color(hex: "#22C55E") : .secondary)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .containerBackground(for: .widget) {
        ContainerRelativeShape()
          .fill(
            LinearGradient(
              colors: [
                Color(.systemBackground),
                Color(.systemBackground).opacity(0.95)
              ],
              startPoint: .topLeading,
              endPoint: .bottomTrailing
            )
          )
      }
    } else {
      // Empty state
      VStack(spacing: 8) {
        ZStack {
          Circle()
            .fill(Color(hex: "#3B82F6").opacity(0.1))
            .frame(width: 52, height: 52)
          Image(systemName: "checkmark.circle")
            .font(.system(size: 26, weight: .medium))
            .foregroundColor(Color(hex: "#3B82F6"))
        }
        Text("SnapHabit")
          .font(.system(size: 12, weight: .semibold, design: .rounded))
          .foregroundColor(.secondary)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .containerBackground(for: .widget) {
        ContainerRelativeShape()
          .fill(Color(.systemBackground))
      }
    }
  }
}

// MARK: - Medium Widget View

struct MediumWidgetView: View {
  let snapshot: WidgetSnapshot?

  var body: some View {
    if let snap = snapshot {
      let nonRest = snap.habits.filter { $0.status != "rest" }
      let displayHabits = Array(nonRest.prefix(4))
      let active = nonRest.filter { $0.status != "skipped" }
      let completed = active.filter { $0.isCompleted }.count
      let total = max(active.count, 1)
      let progress = Double(completed) / Double(total)
      let allDone = completed == total && total > 0
      let remaining = nonRest.count - displayHabits.count

      HStack(spacing: 14) {
        // Left column: ring + label
        VStack(spacing: 8) {
          ZStack {
            ProgressRing(
              progress: progress,
              lineWidth: 6,
              gradientColors: allDone
                ? [Color(hex: "#22C55E"), Color(hex: "#10B981")]
                : [Color(hex: "#3B82F6"), Color(hex: "#8B5CF6")],
              size: 60
            )
            if allDone {
              Image(systemName: "checkmark")
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(Color(hex: "#22C55E"))
            } else {
              Text("\(completed)/\(total)")
                .font(.system(size: 13, weight: .bold, design: .rounded))
            }
          }
          Text(allDone ? "Done! 🎉" : greeting())
            .font(.system(size: 10, weight: .semibold, design: .rounded))
            .foregroundColor(allDone ? Color(hex: "#22C55E") : .secondary)
            .lineLimit(1)
        }
        .frame(width: 76)

        // Divider
        RoundedRectangle(cornerRadius: 1)
          .fill(Color.gray.opacity(0.15))
          .frame(width: 1.5)
          .padding(.vertical, 4)

        // Right column: habit list
        VStack(alignment: .leading, spacing: 5) {
          ForEach(displayHabits) { habit in
            HabitRow(habit: habit, compact: true)
          }

          if remaining > 0 {
            Text("+\(remaining) more")
              .font(.system(size: 10, weight: .medium, design: .rounded))
              .foregroundColor(.secondary)
              .padding(.leading, 4)
          }
        }
      }
      .padding(.horizontal, 6)
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .containerBackground(for: .widget) {
        ContainerRelativeShape()
          .fill(
            LinearGradient(
              colors: [
                Color(.systemBackground),
                Color(.systemBackground).opacity(0.95)
              ],
              startPoint: .topLeading,
              endPoint: .bottomTrailing
            )
          )
      }
    } else {
      HStack(spacing: 12) {
        ZStack {
          Circle()
            .fill(Color(hex: "#3B82F6").opacity(0.1))
            .frame(width: 44, height: 44)
          Image(systemName: "checkmark.circle")
            .font(.system(size: 22, weight: .medium))
            .foregroundColor(Color(hex: "#3B82F6"))
        }
        VStack(alignment: .leading, spacing: 2) {
          Text("SnapHabit")
            .font(.system(size: 14, weight: .semibold, design: .rounded))
          Text("Tap to start tracking habits")
            .font(.system(size: 12))
            .foregroundColor(.secondary)
        }
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .containerBackground(for: .widget) {
        ContainerRelativeShape()
          .fill(Color(.systemBackground))
      }
    }
  }
}

// MARK: - Large Widget View

struct LargeWidgetView: View {
  let snapshot: WidgetSnapshot?

  var body: some View {
    if let snap = snapshot {
      let nonRest = snap.habits.filter { $0.status != "rest" }
      let displayHabits = Array(nonRest.prefix(8))
      let active = nonRest.filter { $0.status != "skipped" }
      let completed = active.filter { $0.isCompleted }.count
      let total = max(active.count, 1)
      let progress = Double(completed) / Double(total)
      let allDone = completed == total && total > 0
      let remaining = nonRest.count - displayHabits.count

      VStack(spacing: 12) {
        // Header row
        HStack {
          VStack(alignment: .leading, spacing: 2) {
            Text(greeting())
              .font(.system(size: 14, weight: .semibold, design: .rounded))
              .foregroundColor(.secondary)
            HStack(spacing: 6) {
              Text(allDone ? "All habits done!" : "\(completed) of \(total) completed")
                .font(.system(size: 16, weight: .bold, design: .rounded))
              if allDone {
                Text("🎉")
                  .font(.system(size: 14))
              }
            }
          }
          Spacer()
          ZStack {
            ProgressRing(
              progress: progress,
              lineWidth: 5,
              gradientColors: allDone
                ? [Color(hex: "#22C55E"), Color(hex: "#10B981")]
                : [Color(hex: "#3B82F6"), Color(hex: "#8B5CF6")],
              size: 44
            )
            Text("\(Int(progress * 100))%")
              .font(.system(size: 11, weight: .bold, design: .rounded))
              .foregroundColor(allDone ? Color(hex: "#22C55E") : Color(hex: "#3B82F6"))
          }
        }

        // Progress bar
        GeometryReader { geo in
          ZStack(alignment: .leading) {
            RoundedRectangle(cornerRadius: 4)
              .fill(Color.gray.opacity(0.1))
              .frame(height: 6)
            RoundedRectangle(cornerRadius: 4)
              .fill(
                LinearGradient(
                  colors: allDone
                    ? [Color(hex: "#22C55E"), Color(hex: "#10B981")]
                    : [Color(hex: "#3B82F6"), Color(hex: "#8B5CF6")],
                  startPoint: .leading,
                  endPoint: .trailing
                )
              )
              .frame(width: geo.size.width * min(progress, 1.0), height: 6)
          }
        }
        .frame(height: 6)

        // Habit list
        VStack(spacing: 6) {
          ForEach(displayHabits) { habit in
            HabitRow(habit: habit, compact: false)

            if habit.id != displayHabits.last?.id {
              Divider()
                .opacity(0.4)
            }
          }
        }

        if remaining > 0 {
          Text("+\(remaining) more habits")
            .font(.system(size: 11, weight: .medium, design: .rounded))
            .foregroundColor(.secondary)
        }

        Spacer(minLength: 0)
      }
      .padding(.horizontal, 4)
      .padding(.top, 2)
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .containerBackground(for: .widget) {
        ContainerRelativeShape()
          .fill(
            LinearGradient(
              colors: [
                Color(.systemBackground),
                Color(.systemBackground).opacity(0.95)
              ],
              startPoint: .topLeading,
              endPoint: .bottomTrailing
            )
          )
      }
    } else {
      VStack(spacing: 12) {
        ZStack {
          Circle()
            .fill(Color(hex: "#3B82F6").opacity(0.1))
            .frame(width: 60, height: 60)
          Image(systemName: "checkmark.circle")
            .font(.system(size: 30, weight: .medium))
            .foregroundColor(Color(hex: "#3B82F6"))
        }
        Text("SnapHabit")
          .font(.system(size: 16, weight: .semibold, design: .rounded))
        Text("Tap to start tracking your habits")
          .font(.system(size: 13))
          .foregroundColor(.secondary)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .containerBackground(for: .widget) {
        ContainerRelativeShape()
          .fill(Color(.systemBackground))
      }
    }
  }
}

// MARK: - Widget Definition

struct SnapHabitWidget: Widget {
  let kind: String = "SnapHabitWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: HabitTimelineProvider()) { entry in
      WidgetEntryView(entry: entry)
    }
    .configurationDisplayName("Today's Habits")
    .description("Track your daily habit progress at a glance.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}

struct WidgetEntryView: View {
  @Environment(\.widgetFamily) var family
  let entry: HabitEntry

  var body: some View {
    switch family {
    case .systemSmall:
      SmallWidgetView(snapshot: entry.snapshot)
    case .systemMedium:
      MediumWidgetView(snapshot: entry.snapshot)
    case .systemLarge:
      LargeWidgetView(snapshot: entry.snapshot)
    default:
      SmallWidgetView(snapshot: entry.snapshot)
    }
  }
}
