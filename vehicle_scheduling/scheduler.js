/**
 * @param {number} depotHours
 * @param {Array} vehicles
 * @returns {Object}
 */
function solveKnapsackScheduling(depotHours, vehicles) {
  try {
    if (!depotHours || depotHours <= 0) {
      throw new Error("Invalid depot hours: must be greater than 0");
    }

    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      throw new Error("Invalid vehicles array: must be a non-empty array");
    }

    vehicles.forEach((vehicle, index) => {
      if (!vehicle.duration || !vehicle.impact || !vehicle.taskId) {
        throw new Error(
          `Vehicle at index ${index} missing required fields: duration, impact, or taskId`,
        );
      }
    });

    const n = vehicles.length;
    const capacity = Math.floor(depotHours);

    const dp = Array(n + 1)
      .fill(null)
      .map(() => Array(capacity + 1).fill(0));

    for (let i = 1; i <= n; i++) {
      for (let w = 0; w <= capacity; w++) {
        const currentVehicle = vehicles[i - 1];
        const vehicleDuration = Math.floor(currentVehicle.duration);
        const vehicleImpact = currentVehicle.impact;

        if (vehicleDuration <= w) {
          dp[i][w] = Math.max(
            vehicleImpact + dp[i - 1][w - vehicleDuration],
            dp[i - 1][w],
          );
        } else {
          dp[i][w] = dp[i - 1][w];
        }
      }
    }

    const selectedTaskIds = [];
    const selectedVehicles = [];
    let remainingCapacity = capacity;

    for (let i = n; i > 0 && remainingCapacity > 0; i--) {
      if (dp[i][remainingCapacity] !== dp[i - 1][remainingCapacity]) {
        const vehicle = vehicles[i - 1];
        selectedTaskIds.push(vehicle.taskId);
        selectedVehicles.push(vehicle);
        remainingCapacity -= Math.floor(vehicle.duration);
      }
    }

    const totalScore = dp[n][capacity];
    const totalDuration = capacity - remainingCapacity;

    return {
      success: true,
      totalScore,
      selectedTaskIds: selectedTaskIds.reverse(),
      selectedVehicles: selectedVehicles.reverse(),
      totalDuration,
      depotHoursUsed: totalDuration,
      depotHoursAvailable: depotHours,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      totalScore: 0,
      selectedTaskIds: [],
      selectedVehicles: [],
    };
  }
}

function scheduleVehiclesHandler(req, res) {
  try {
    const { depot_hours, vehicles } = req.body;

    if (!depot_hours || !vehicles) {
      return res.status(400).json({
        error: "Missing required fields: depot_hours and vehicles",
      });
    }

    const result = solveKnapsackScheduling(depot_hours, vehicles);

    if (!result.success) {
      return res.status(400).json({
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        totalScore: result.totalScore,
        taskIds: result.selectedTaskIds,
        vehicles: result.selectedVehicles.map((v) => ({
          taskId: v.taskId,
          duration: v.duration,
          impact: v.impact,
        })),
        depotHoursUsed: result.totalDuration,
        depotHoursAvailable: result.depotHoursAvailable,
        optimization: {
          vehiclesConsidered: vehicles.length,
          vehiclesSelected: result.selectedTaskIds.length,
          utilizationRate:
            ((result.totalDuration / result.depotHoursAvailable) * 100).toFixed(
              2,
            ) + "%",
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error: " + error.message,
    });
  }
}

module.exports = {
  solveKnapsackScheduling,
  scheduleVehiclesHandler,
};
