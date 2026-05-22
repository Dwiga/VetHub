class AddPicToTreatment < ActiveRecord::Migration[8.1]
  def change
    add_reference :treatments, :user, null: false, foreign_key: true
  end
end
