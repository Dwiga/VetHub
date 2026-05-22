class Treatment < ApplicationRecord
  enum :type, { inpatient: 0, outpatient: 1, routine: 2 }
end
