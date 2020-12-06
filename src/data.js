class Data {
  static STATUSES = {
    pending: "PENDING",
    error: "ERROR",
    success: "SUCCESS",
  };

  constructor(initialValue = null) {
    this.data = initialValue;
    this.status = Data.STATUSES.pending;
  }
}

export default Data;
